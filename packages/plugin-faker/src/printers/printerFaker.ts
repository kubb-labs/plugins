import { mapSchemaItems, mapSchemaMembers } from '@internals/shared'
import { buildObject, objectKey, stringify, toRegExpString } from '@internals/utils'
import { ast, containsCircularRef, Diagnostics, syncSchemaRef } from 'kubb/kit'
import type { PluginFaker, ResolverFaker } from '../types.ts'
import { canOverrideSchema } from '../utils.ts'

/**
 * Partial map of node-type overrides for the Faker printer. Each key is a
 * `SchemaType` (`'string'`, `'date'`, ...) and each handler returns the
 * Faker expression for that schema as a string. Use `this.transform` to
 * recurse into nested schema nodes, `this.base` to reuse the built-in handler,
 * and `this.options` to read printer options.
 *
 * @example Override the integer handler
 * ```ts
 * pluginFaker({
 *   printer: {
 *     nodes: {
 *       integer() {
 *         return 'faker.number.float()'
 *       },
 *     },
 *   },
 * })
 * ```
 */
export type PrinterFakerNodes = ast.PrinterPartial<string, PrinterFakerOptions>

/**
 * Options passed to the Faker printer at instantiation: the parser library
 * for date strings, the regex generator, and the resolver used to compute
 * identifiers.
 */
export type PrinterFakerOptions = {
  dateParser?: PluginFaker['resolvedOptions']['dateParser']
  regexGenerator?: PluginFaker['resolvedOptions']['regexGenerator']
  resolver: ResolverFaker
  typeName?: string
  schemaName?: string
  nestedInObject?: boolean
  /**
   * Set while printing the members of a union (`oneOf`). Object properties then index their
   * type as `(NonNullable<T> & Record<K, unknown>)[K]` instead of `NonNullable<T>[K]`, so a key
   * carried by only some branches stays valid (a plain index would be a TS2339).
   */
  nestedInUnion?: boolean
  nodes?: PrinterFakerNodes
  /**
   * Names of schemas that participate in a circular dependency chain.
   * Properties whose schema transitively references one of these are emitted
   * as lazy getters so that user overrides via the `data` parameter prevent
   * the recursive faker call from ever executing (avoiding stack overflow).
   */
  cyclicSchemas?: ReadonlySet<string>
}

/**
 * Factory options for the Faker printer, defining input/output types and configuration.
 */
export type PrinterFakerFactory = ast.PrinterFactoryOptions<'faker', PrinterFakerOptions, string, string>

/**
 * Formats that put a whole number inside a `type: 'string'` schema, the way ProtoJSON encodes
 * 64-bit integers, so the mock has to be digits rather than letters.
 *
 * @see https://protobuf.dev/programming-guides/json/#int64-strings
 */
const integerFormats: ReadonlySet<string> = new Set(['int32', 'int64', 'uint64'])

const maxInt32 = 2_147_483_647

/**
 * `faker.number.float()` or `faker.number.int()`, with `min` and `max` passed only when set.
 */
function numberCall(kind: 'float' | 'int', min?: number, max?: number): string {
  const args = [min !== undefined && `min: ${min}`, max !== undefined && `max: ${max}`].filter(Boolean).join(', ')

  return `faker.number.${kind}(${args ? `{ ${args} }` : ''})`
}

/**
 * A `date` or `time` value: an ISO substring, a `dateParser` call, or a `Date` when `representation` is `'date'`.
 */
function dateTimeCall(
  representation: 'date' | 'string',
  { format, substring }: { format: string; substring: string },
  parser: PluginFaker['resolvedOptions']['dateParser'] = 'faker',
  schemaName?: string,
): string {
  if (representation === 'string') {
    return parser !== 'faker' ? `${parser}(faker.date.anytime()).format("${format}")` : `faker.date.anytime().toISOString().substring(${substring})`
  }

  if (parser !== 'faker') {
    throw new Diagnostics.Error({
      code: Diagnostics.code.invalidPluginOptions,
      severity: 'error',
      message: `Option \`dateParser: '${parser}'\` cannot format the adapter's \`dateType: 'date'\` values${schemaName ? ` in schema "${schemaName}"` : ''}.`,
      help: "Set adapterOas({ dateType: 'string' }) or remove `dateParser`.",
      location: { kind: 'config' },
      plugin: 'plugin-faker',
    })
  }

  return 'faker.date.anytime()'
}

function matches(value: string, regexGenerator: 'faker' | 'randexp' = 'faker'): string {
  if (regexGenerator === 'randexp') {
    return `${toRegExpString(value, 'RandExp')}.gen()`
  }

  return `faker.helpers.fromRegExp(${toRegExpString(value, null)})`
}

function parseEnumValue(value: string | number | boolean | null | undefined) {
  if (typeof value === 'string') {
    return stringify(value)
  }

  return value
}

/**
 * Reads the discriminator literal off a variant, with whether its property is required, or
 * `undefined` when it can't be determined.
 *
 * A variant carries exactly one discriminator value, so a property resolving to several literals
 * (a `ref` to the enum shared by every branch, say) identifies no branch and narrows nothing.
 */
function getDiscriminator(
  member: ast.SchemaNode,
  discriminatorPropertyName: string,
): { value: string | number | boolean | null; required: boolean } | undefined {
  for (const property of ast.resolveSchemaProperties({ node: member, propertyName: discriminatorPropertyName })) {
    const values = ast.getSchemaLiteralValues(property.schema)
    if (values.length === 1) {
      return { value: values[0]!, required: property.required }
    }
  }

  return undefined
}

/**
 * Type expression for an object property's value, indexed off the parent `typeName`.
 *
 * In a union (`oneOf`), a key that only some branches declare turns a plain `NonNullable<T>[K]`
 * into a TS2339 error, so union members guard the access. The breakdown is below.
 */
function indexedTypeName(typeName: string, propertyName: string, nestedInUnion?: boolean): string {
  const key = JSON.stringify(propertyName)

  // `(NonNullable<T> & Record<K, unknown>)[K]`, read inside-out:
  //   NonNullable<T>          strips null and undefined from the parent type T.
  //   & Record<K, unknown>    forces every branch to have key K. A branch that already declares K
  //                           keeps it (`T[K] & unknown` is `T[K]`); a branch missing K gains it as `unknown`.
  //   [K]                     reads the key, which is now always present, so it never hits TS2339.
  // For a single object T the intersection does nothing, leaving `T[K]`.
  return nestedInUnion ? `(NonNullable<${typeName}> & Record<${key}, unknown>)[${key}]` : `NonNullable<${typeName}>[${key}]`
}

/**
 * Creates a Faker printer that generates mock data generation code from schema nodes.
 * Handles circular references gracefully by emitting memoizing getters for cyclic properties.
 */
export const printerFaker: (options: PrinterFakerOptions) => ast.Printer<PrinterFakerFactory> = ast.createPrinter<PrinterFakerFactory>((options) => {
  const printNested = (node: ast.SchemaNode, overrideOptions: Partial<PrinterFakerOptions> = {}): string => {
    return (
      printerFaker({
        ...options,
        ...overrideOptions,
        nodes: options.nodes,
      }).print(node) ?? 'undefined'
    )
  }

  return {
    name: 'faker',
    options,
    nodes: {
      any: () => 'undefined',
      unknown: () => 'undefined',
      void: () => 'undefined',
      boolean: () => 'faker.datatype.boolean()',
      null: () => 'null',
      string(node) {
        if (node.pattern) {
          return matches(node.pattern, this.options.regexGenerator)
        }

        if (node.format && integerFormats.has(node.format)) {
          return node.format === 'int32' ? `faker.number.int({ max: ${maxInt32} }).toString()` : 'faker.number.bigInt().toString()'
        }

        const { min, max } = node
        if (min !== undefined && max !== undefined) return `faker.string.alpha({ length: { min: ${min}, max: ${max} } })`
        if (max !== undefined || min !== undefined) return `faker.string.alpha({ length: ${max ?? min} })`

        return 'faker.string.alpha()'
      },
      email: () => 'faker.internet.email()',
      url: () => 'faker.internet.url()',
      uuid: () => 'faker.string.uuid()',
      number: (node) => numberCall('float', node.min, node.max),
      integer: (node) => numberCall('int', node.min, node.max),
      bigint: () => 'faker.number.bigInt()',
      blob: () => 'faker.image.url() as unknown as Blob',
      datetime: () => 'faker.date.anytime().toISOString()',
      date(node) {
        return dateTimeCall(node.representation ?? 'string', { format: 'YYYY-MM-DD', substring: '0, 10' }, this.options.dateParser, this.options.schemaName)
      },
      time(node) {
        return dateTimeCall(node.representation ?? 'string', { format: 'HH:mm:ss', substring: '11, 19' }, this.options.dateParser, this.options.schemaName)
      },
      ref(node) {
        // `resolveRefName` prefers the node's `targetName` (set for collision or macro renames),
        // then the $ref path segment, since node.name may have been overridden (e.g. by
        // single-member allOf flatten using the property-derived child name). Inline refs
        // (without $ref) from faker utils already carry resolved helper names.
        const refName = ast.resolveRefName(node)

        if (!refName) {
          throw new Diagnostics.Error({
            code: Diagnostics.code.pluginFailed,
            severity: 'error',
            message: `Ref node "${node.ref ?? node.name ?? 'unknown'}"${this.options.schemaName ? ` in schema "${this.options.schemaName}"` : ''} has no name.`,
            plugin: 'plugin-faker',
          })
        }

        if (this.options.schemaName && refName === this.options.schemaName) {
          return this.options.typeName ? `undefined as unknown as ${this.options.typeName}` : 'undefined as unknown'
        }

        // Internal helper refs (for generated response/data helpers) are already
        // emitted with resolver output and should not be transformed twice.
        const resolvedName = node.ref ? this.options.resolver.name(refName) : refName

        if (!this.options.nestedInObject && canOverrideSchema(ast.resolveRef(node))) {
          return `${resolvedName}(data)`
        }

        return `${resolvedName}()`
      },
      enum(node) {
        const { typeName } = this.options
        const values = ast.getSchemaLiteralValues(node)

        if (values.length === 1 && values[0] !== null && typeof values[0] === 'object') {
          return JSON.stringify(values[0])
        }

        return `faker.helpers.arrayElement${typeName ? `<${typeName}>` : ''}([${values.map(parseEnumValue).join(', ')}])`
      },
      union(node): string {
        const { discriminatorPropertyName } = node
        const baseTypeName = this.options.typeName

        const items: Array<string> = mapSchemaMembers(node, (member) => {
          // For a discriminated union, narrow each variant to its own branch so nested
          // `NonNullable<T>[K]` indexes resolve against that branch instead of the whole union.
          const discriminator = discriminatorPropertyName ? getDiscriminator(member, discriminatorPropertyName) : undefined

          if (baseTypeName && discriminator) {
            // An optional discriminator (`strategy?: 'a'`) does not extend `{ strategy: 'a' }`,
            // so match it as optional too.
            const key = `${JSON.stringify(discriminatorPropertyName)}${discriminator.required ? '' : '?'}`
            const typeName = `Extract<NonNullable<${baseTypeName}>, { ${key}: ${parseEnumValue(discriminator.value)} }>`

            return printNested(member, { typeName, nestedInObject: true, nestedInUnion: true })
          }

          // Without a discriminator, keep the union type but guard each indexed access (see
          // `indexedTypeName`) so a key carried by only some branches resolves to `unknown`
          // rather than erroring with TS2339.
          return printNested(member, { typeName: baseTypeName, nestedInObject: true, nestedInUnion: true })
        })
          .map(({ output }) => output)
          .filter((item): item is string => Boolean(item))

        return `faker.helpers.arrayElement([${items.join(', ')}])`
      },
      intersection(node): string {
        const items: Array<string> = mapSchemaMembers(node, (member) =>
          printNested(member, {
            nestedInObject: true,
          }),
        )
          .map(({ output }) => output)
          // An `allOf` member with no shape (any/unknown/void → 'undefined') adds no
          // constraint. Keeping it would spread `...undefined` into the merged object.
          .filter((item): item is string => Boolean(item) && item !== 'undefined')

        if (items.length === 0) return '{}'

        return items.length === 1 ? items[0]! : `{...${items.join(', ...')}}`
      },
      array(node): string {
        const items: Array<string> = mapSchemaItems(node, (member) =>
          printNested(member, {
            typeName: this.options.typeName ? `NonNullable<${this.options.typeName}>[number]` : undefined,
            nestedInObject: true,
          }),
        )
          .map(({ output }) => output)
          .filter((item): item is string => Boolean(item))

        if (items.length > 1) {
          return `faker.helpers.arrayElements([${items.join(', ')}])`
        }

        const { min, max } = node
        const item = items[0]
        if (min !== undefined && max !== undefined) return `faker.helpers.multiple(() => (${item}), { count: { min: ${min}, max: ${max} }})`
        if (min !== undefined) return `faker.helpers.multiple(() => (${item}), { count: ${min} })`
        if (max !== undefined) return `faker.helpers.multiple(() => (${item}), { count: { min: 0, max: ${max} }})`

        return `faker.helpers.multiple(() => (${item}))`
      },
      tuple(node): string {
        const items: Array<string> = (node.items ?? [])
          .map((member, index) =>
            printNested(member, {
              typeName: this.options.typeName ? `NonNullable<${this.options.typeName}>[${index}]` : undefined,
              nestedInObject: true,
            }),
          )
          .filter((item): item is string => Boolean(item))

        return `[${items.join(', ')}]`
      },
      object(node): string {
        const cyclicSchemas = this.options.cyclicSchemas
        const keySchema = node.propertyNames && syncSchemaRef(node.propertyNames)
        const valueSchema = node.additionalProperties
        const recordProperties =
          keySchema?.type === 'enum' && typeof valueSchema === 'object'
            ? ast
                .getSchemaLiteralValues(keySchema)
                .filter((key): key is string => typeof key === 'string' && !node.properties.some((property) => property.name === key))
                .map((name) => ast.factory.createProperty({ name, schema: valueSchema }))
            : []
        const entries = [...node.properties, ...recordProperties].map((property): string => {
          const value: string =
            printNested(property.schema, {
              typeName: this.options.typeName ? indexedTypeName(this.options.typeName, property.name, this.options.nestedInUnion) : undefined,
              nestedInObject: true,
            }) ?? 'undefined'

          // When the property's schema transitively references a schema that is
          // part of a circular dependency (other than the current schema itself),
          // emit a memoizing lazy getter. On first access it computes the value,
          // replaces itself with a plain data property via Object.defineProperty,
          // and returns the cached value, so every subsequent read is stable.
          if (cyclicSchemas && containsCircularRef(property.schema, { circularSchemas: cyclicSchemas, excludeName: this.options.schemaName })) {
            return `get ${objectKey(property.name)}() { const _value = ${value}; Object.defineProperty(this, ${JSON.stringify(property.name)}, { value: _value, configurable: true, writable: true, enumerable: true }); return _value }`
          }

          return `${objectKey(property.name)}: ${value}`
        })

        return buildObject(entries)
      },
    },
    overrides: options.nodes,
  }
})
