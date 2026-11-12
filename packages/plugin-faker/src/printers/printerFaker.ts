import { buildObject, objectKey, toRegExpString } from '@internals/utils'
import { ast, createPrinter, Diagnostics, text } from '@kubb/kit'
import type { PluginFaker, ResolverFaker } from '../types.ts'
import { canOverrideSchema, dateParserName, isObjectSchema } from '../utils.ts'

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
// The largest value of a 32-bit format, which faker's default `max` exceeds.
const maxValueByFormat: Record<string, number> = { int32: maxInt32, uint32: 4_294_967_295 }

// A ref back into its own cycle is left empty, so a mock of a recursive schema is finite and can be serialized.
function isCyclicRef(node: ast.SchemaNode, { schemaName, cyclicSchemas }: PrinterFakerOptions): boolean {
  if (node.type !== 'ref' || !schemaName) return false
  const refName = ast.ref.getName(node)

  return refName === schemaName || Boolean(refName && cyclicSchemas?.has(schemaName) && cyclicSchemas.has(refName))
}

/**
 * `faker.number.float()`, `faker.number.int()` or `faker.number.bigInt()`, with `min` and `max` passed only when set,
 * moved inside an exclusive bound, or needed so a lone bound does not contradict faker's default for the other.
 */
function numberCall(
  kind: 'float' | 'int' | 'bigInt',
  { min, max, exclusive, multipleOf }: Pick<ast.NumberSchemaNode, 'min' | 'max' | 'exclusive' | 'multipleOf'>,
): string {
  const isWhole = kind !== 'float'
  // Faker's `int` and `bigInt` reject a fractional `multipleOf`.
  const grid = isWhole && !Number.isInteger(multipleOf) ? undefined : multipleOf
  // Faker returns points of the `multipleOf` grid, ends included, so an exclusive bound moves to the next point.
  // shortcut: without a grid a float's exclusive `min` is passed as is, so faker can return it by chance; nudge it up once a mock hits it.
  const { min: lower, max: upper } = ast.schema.getNumberBounds({ min, max, exclusive, integer: isWhole, step: grid })
  // Faker fills a missing `min` with `0`, and a float's missing `max` with `1`, which a lone bound on the other side contradicts.
  // The span holds grid points, so faker always finds a multiple.
  const span = 100 * (grid ?? 1)
  const maxValue = kind === 'float' && lower !== undefined && upper === undefined && (lower >= 1 || grid !== undefined) ? lower + span : upper
  const minValue = maxValue !== undefined && lower === undefined && (isWhole ? maxValue < 0 : maxValue <= 0) ? maxValue - span : lower
  const suffix = kind === 'bigInt' ? 'n' : ''
  const args = [
    minValue !== undefined && `min: ${minValue}${suffix}`,
    maxValue !== undefined && `max: ${maxValue}${suffix}`,
    grid !== undefined && `multipleOf: ${grid}${suffix}`,
  ]
    .filter(Boolean)
    .join(', ')

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
    return parser !== 'faker'
      ? `${dateParserName(parser)}(faker.date.anytime()).format("${format}")`
      : `faker.date.anytime().toISOString().substring(${substring})`
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

// Eight letters or digits are base64url as they are: no padding, and none of the characters base64 swaps.
const encodingCalls = new Map<string | undefined, string>([
  ['base64', 'btoa(faker.string.alpha())'],
  ['base64url', 'faker.string.alphanumeric(8)'],
])

// Formats `plugin-zod` checks with a dedicated constructor, which a random string fails.
const stringFormatCalls = new Map<string | undefined, string>([
  ['jwt', 'faker.internet.jwt()'],
  ['ulid', 'faker.string.ulid()'],
  ['iban', 'faker.finance.iban()'],
  ['duration', "'P1D'"],
  ['hostname', 'faker.internet.domainName()'],
])

// The members an escape becomes inside a character class: `\d` and `\w`, and the punctuation `faker.helpers.fromRegExp` reads there.
const classEscapes = new Map<string, string>([['d', '0-9'], ['w', 'A-Za-z0-9_'], ...Array.from('-!@#$&()`.+,"', (char): [string, string] => [char, char])])

// `faker.helpers.fromRegExp` prints `\d`, `\w`, escaped literals and an open-ended `{n,}` as written, so they become classes and `{n,n+10}`.
// shortcut: groups, alternation and `\s` stay unsupported, as `regexGenerator: 'randexp'` covers them.
function toFakerPattern(pattern: string): string {
  let result = ''
  let inClass = false
  // Where the open class's members start, after `[` or `[^`: faker reads a literal `-` only there.
  let classStart = -1
  for (let index = 0; index < pattern.length; index++) {
    const char = pattern[index]!
    const next = pattern[index + 1]
    if (char === '\\' && next !== undefined) {
      index++
      if (inClass && next === '-') {
        if (result[classStart] !== '-') result = `${result.slice(0, classStart)}-${result.slice(classStart)}`
        continue
      }
      const classMembers = classEscapes.get(next)
      if (classMembers === undefined) {
        result += `\\${next}`
        continue
      }
      result += inClass ? classMembers : `[${classMembers}]`
      continue
    }
    if (char === '[' && !inClass) {
      inClass = true
      result += next === '^' ? '[^' : '['
      if (next === '^') index++
      classStart = result.length
      continue
    }
    if (char === ']') inClass = false
    result += char
  }

  return result.replace(/\{(\d+),\}/g, (_, min: string) => `{${min},${Number(min) + 10}}`)
}

function matches(value: string, regexGenerator: 'faker' | 'randexp' = 'faker'): string {
  if (regexGenerator === 'randexp') {
    return `${toRegExpString(value, 'RandExp')}.gen()`
  }

  return `faker.helpers.fromRegExp(${toRegExpString(toFakerPattern(value), null)})`
}

function parseEnumValue(value: string | number | boolean | null | undefined) {
  if (typeof value === 'string') {
    return text.quote(value)
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
  for (const property of ast.schema.findProperties({ node: member, propertyName: discriminatorPropertyName })) {
    const values = ast.schema.getLiterals(property.schema)
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

// In a union only some branches are arrays, and indexing the others with `number` is a TS2537 error.
function itemTypeName(typeName: string, nestedInUnion?: boolean): string {
  return nestedInUnion ? `Extract<NonNullable<${typeName}>, ReadonlyArray<unknown>>[number]` : `NonNullable<${typeName}>[number]`
}

/**
 * Creates a Faker printer that generates mock data generation code from schema nodes.
 * Handles circular references gracefully by emitting memoizing getters for cyclic properties.
 */
export const printerFaker: (options: PrinterFakerOptions) => ast.Printer<PrinterFakerFactory> = createPrinter<PrinterFakerFactory>((options) => {
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

        const formatCall = stringFormatCalls.get(node.format)
        if (formatCall) return formatCall

        const contentSchema = ast.schema.getEmbeddedJson(node)
        // The document is typed by its own schema, not by the string that holds it.
        if (contentSchema) return `JSON.stringify(${printNested(contentSchema, { typeName: undefined, nestedInObject: true, nestedInUnion: false })})`

        const encodingCall = encodingCalls.get(node.content?.encoding?.toLowerCase())
        if (encodingCall) return encodingCall

        const { min, max } = node
        // A string as long as a large `maxLength` makes a mock of megabytes, so the length stays within 100 of the minimum.
        if (max !== undefined) return `faker.string.alpha({ length: { min: ${min ?? Math.min(1, max)}, max: ${Math.min(max, (min ?? 0) + 100)} } })`
        if (min !== undefined) return `faker.string.alpha({ length: ${min} })`

        return 'faker.string.alpha()'
      },
      email: () => 'faker.internet.email()',
      url: () => 'faker.internet.url()',
      uuid: () => 'faker.string.uuid()',
      ipv4: () => 'faker.internet.ipv4()',
      ipv6: () => 'faker.internet.ipv6()',
      number: (node) => numberCall('float', node),
      integer: (node) =>
        numberCall(
          'int',
          node.format && node.format in maxValueByFormat ? { ...node, max: Math.min(node.max ?? Infinity, maxValueByFormat[node.format]!) } : node,
        ),
      bigint: (node) => numberCall('bigInt', node),
      blob: () => 'new Blob([faker.string.alpha()])',
      datetime(node) {
        const parser = this.options.dateParser ?? 'faker'
        if (parser === 'faker') return 'faker.date.anytime().toISOString()'
        // ISO 8601 that matches the node: no zone when local, a numeric offset, or UTC `Z`.
        const format = node.local ? 'YYYY-MM-DDTHH:mm:ss' : node.offset ? 'YYYY-MM-DDTHH:mm:ssZ' : 'YYYY-MM-DDTHH:mm:ss[Z]'

        return `${dateParserName(parser)}(faker.date.anytime()).format("${format}")`
      },
      date(node) {
        return dateTimeCall(node.representation ?? 'string', { format: 'YYYY-MM-DD', substring: '0, 10' }, this.options.dateParser, this.options.schemaName)
      },
      time(node) {
        return dateTimeCall(node.representation ?? 'string', { format: 'HH:mm:ss', substring: '11, 19' }, this.options.dateParser, this.options.schemaName)
      },
      ref(node) {
        // `ast.ref.getName` prefers the node's `targetName` (set for collision or macro renames),
        // then the $ref path segment, since node.name may have been overridden (e.g. by
        // single-member allOf flatten using the property-derived child name). Inline refs
        // (without $ref) from faker utils already carry resolved helper names.
        const refName = ast.ref.getName(node)

        if (!refName) {
          throw new Diagnostics.Error({
            code: Diagnostics.code.pluginFailed,
            severity: 'error',
            message: `Ref node "${node.ref ?? node.name ?? 'unknown'}"${this.options.schemaName ? ` in schema "${this.options.schemaName}"` : ''} has no name.`,
            plugin: 'plugin-faker',
          })
        }

        if (isCyclicRef(node, this.options)) {
          return this.options.typeName ? `undefined as unknown as ${this.options.typeName}` : 'undefined as unknown'
        }

        // Internal helper refs (for generated response/data helpers) are already
        // emitted with resolver output and should not be transformed twice.
        const resolvedName = node.ref ? this.options.resolver.name(refName) : refName

        if (!this.options.nestedInObject && canOverrideSchema(ast.ref.getSchema(node))) {
          return `${resolvedName}(data)`
        }

        return `${resolvedName}()`
      },
      enum(node) {
        const { typeName } = this.options
        const values = ast.schema.getLiterals(node)

        if (values.length === 1 && values[0] !== null && typeof values[0] === 'object') {
          return JSON.stringify(values[0])
        }

        // The values are asserted as the property's type, not checked against it. Inside an `allOf` or `oneOf` that type can be
        // narrower than the enum, or `never`, and a type argument would then reject the values the schema itself lists.
        return `faker.helpers.arrayElement([${values.map(parseEnumValue).join(', ')}]${typeName ? ` as Array<${typeName}>` : ''})`
      },
      union(node): string {
        const { discriminatorPropertyName } = node
        const baseTypeName = this.options.typeName

        // A member that points back into the cycle would print `undefined`, so the mock picks among the others. A discriminated
        // variant (`allOf: [ref, { type }]`) counts too: spreading its ref reads every lazy getter, which recurses without end.
        const isCyclicMember = (member: ast.SchemaNode) =>
          isCyclicRef(member, this.options) || (member.type === 'intersection' && (member.members ?? []).some((part) => isCyclicRef(part, this.options)))
        const acyclicMembers = (node.members ?? []).filter((member) => !isCyclicMember(member))
        const members = acyclicMembers.length ? acyclicMembers : node.members

        const items: Array<string> = (members ?? [])
          .map((member) => {
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
          .filter((item): item is string => Boolean(item))

        return `faker.helpers.arrayElement([${items.join(', ')}])`
      },
      intersection(node): string {
        const objectMembers = (node.members ?? []).filter((member) => isObjectSchema(member))
        // A ref (the base) spreads first and a union last, so neither a base nor a sibling object overwrites the narrower value
        // an extension or a discriminator sets.
        const memberRank = (member: ast.SchemaNode) => (member.type === 'ref' ? 0 : member.type === 'union' ? 2 : 1)
        const members = objectMembers.length ? objectMembers.toSorted((a, b) => memberRank(a) - memberRank(b)) : node.members
        const items: Array<string> = (members ?? [])
          .map((member) =>
            printNested(member, {
              nestedInObject: true,
              // Only a ref to the schema itself is cut: a cycle through another schema is cut at the property that closes it.
              ...(member.type === 'ref' && ast.ref.getName(member) !== this.options.schemaName ? { cyclicSchemas: undefined } : {}),
            }),
          )
          // An `allOf` member with no shape (any/unknown/void → 'undefined') adds no
          // constraint. Keeping it would spread `...undefined` into the merged object.
          .filter((item): item is string => Boolean(item) && item !== 'undefined')

        if (items.length === 0) return '{}'

        return !objectMembers.length || items.length === 1 ? items.at(-1)! : `{...${items.join(', ...')}}`
      },
      array(node): string {
        // An array of items that would recurse stays empty, which is valid where a list of `undefined` is not.
        if (node.items?.length === 1 && isCyclicRef(node.items[0]!, this.options)) return this.options.typeName ? `[] as ${this.options.typeName}` : '[]'

        const items: Array<string> = (node.items ?? [])
          .map((member) =>
            printNested(member, {
              typeName: this.options.typeName ? itemTypeName(this.options.typeName, this.options.nestedInUnion) : undefined,
              nestedInObject: true,
            }),
          )
          .filter((item): item is string => Boolean(item))

        if (items.length > 1) {
          return `faker.helpers.arrayElements([${items.join(', ')}])`
        }

        const { min, max } = node
        const item = items[0]
        // Like a string, a list stays within 100 items of its minimum, however large `maxItems` is.
        const countRange = max === undefined ? undefined : `{ min: ${min ?? 0}, max: ${Math.min(max, (min ?? 0) + 100)} }`
        // `uniqueArray` takes a fixed length and compares like the zod `Set` check. It returns fewer items when the generator runs out of values.
        if (node.unique) return `faker.helpers.uniqueArray(() => (${item}), ${countRange ? `faker.number.int(${countRange})` : (min ?? 3)})`
        if (countRange) return `faker.helpers.multiple(() => (${item}), { count: ${countRange}})`
        if (min !== undefined) return `faker.helpers.multiple(() => (${item}), { count: ${min} })`

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
        const keySchema = node.propertyNames && ast.ref.mergeSchema(node.propertyNames)
        const valueSchema = node.additionalProperties
        const recordProperties =
          keySchema?.type === 'enum' && typeof valueSchema === 'object'
            ? ast.schema
                .getLiterals(keySchema)
                .filter((key): key is string => typeof key === 'string' && !node.properties.some((property) => property.name === key))
                .map((name) => ast.factory.createProperty({ name, schema: valueSchema }))
            : []
        const properties = [...node.properties, ...recordProperties]
        // `maxProperties` keeps the required properties first.
        const keptProperties = node.max === undefined ? properties : properties.toSorted((a, b) => Number(b.required) - Number(a.required)).slice(0, node.max)
        // `minProperties` adds keys from `additionalProperties`, skipping any name a declared property uses.
        const declaredNames = new Set(properties.map((property) => property.name))
        const extras: typeof keptProperties = []
        for (let index = 1; typeof valueSchema === 'object' && keptProperties.length + extras.length < (node.min ?? 0); index++) {
          const name = `additionalProperty${index}`
          if (!declaredNames.has(name)) extras.push(ast.factory.createProperty({ name, schema: valueSchema }))
        }
        const entries = [...keptProperties, ...extras].map((property): string => {
          const value: string =
            printNested(property.schema, {
              typeName: this.options.typeName ? indexedTypeName(this.options.typeName, property.name, this.options.nestedInUnion) : undefined,
              nestedInObject: true,
              // A required ref to another schema stays, since `undefined` would fail it: the lazy getter keeps the mock finite,
              // and the cycle is cut where it is optional, in a union, or in an array.
              ...(property.required && property.schema.type === 'ref' ? { cyclicSchemas: undefined } : {}),
            }) ?? 'undefined'

          // When the property's schema transitively references a schema that is
          // part of a circular dependency (other than the current schema itself),
          // emit a memoizing lazy getter. On first access it computes the value,
          // replaces itself with a plain data property via Object.defineProperty,
          // and returns the cached value, so every subsequent read is stable.
          if (cyclicSchemas && ast.graph.containsCircular(property.schema, { circularSchemas: cyclicSchemas, excludeName: this.options.schemaName })) {
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
