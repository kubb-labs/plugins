import { buildObject, objectKey, stringify, toRegExpString } from '@internals/utils'
import { ast } from 'kubb/kit'
import type { PluginFaker, ResolverFaker } from '../types.ts'

/**
 * Partial map of node-type overrides for the Faker printer. Each key is a
 * `SchemaType` (`'string'`, `'date'`, ...) and each handler returns the
 * Faker expression for that schema as a string. Use `this.transform` to
 * recurse into nested schema nodes and `this.options` to read printer options.
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
  /**
   * Maps a component `$ref` path to its collision-resolved name. When two components collide
   * (across sections or by case), the adapter renames one of them; the `ref()` handler resolves
   * the referenced name through this map so the emitted faker reference matches the renamed component.
   */
  nameMapping?: ReadonlyMap<string, string>
}

/**
 * Factory options for the Faker printer, defining input/output types and configuration.
 */
export type PrinterFakerFactory = ast.PrinterFactoryOptions<'faker', PrinterFakerOptions, string, string>

const fakerKeywordMapper = {
  any: () => 'undefined',
  unknown: () => 'undefined',
  void: () => 'undefined',
  number: (min?: number, max?: number) => {
    if (max !== undefined && min !== undefined) {
      return `faker.number.float({ min: ${min}, max: ${max} })`
    }

    if (max !== undefined) {
      return `faker.number.float({ max: ${max} })`
    }

    if (min !== undefined) {
      return `faker.number.float({ min: ${min} })`
    }

    return 'faker.number.float()'
  },
  integer: (min?: number, max?: number) => {
    if (max !== undefined && min !== undefined) {
      return `faker.number.int({ min: ${min}, max: ${max} })`
    }

    if (max !== undefined) {
      return `faker.number.int({ max: ${max} })`
    }

    if (min !== undefined) {
      return `faker.number.int({ min: ${min} })`
    }

    return 'faker.number.int()'
  },
  bigint: () => 'faker.number.bigInt()',
  string: (min?: number, max?: number) => {
    if (max !== undefined && min !== undefined) {
      return `faker.string.alpha({ length: { min: ${min}, max: ${max} } })`
    }

    if (max !== undefined) {
      return `faker.string.alpha({ length: ${max} })`
    }

    if (min !== undefined) {
      return `faker.string.alpha({ length: ${min} })`
    }

    return 'faker.string.alpha()'
  },
  boolean: () => 'faker.datatype.boolean()',
  null: () => 'null',
  array: (items: Array<string> = [], min?: number, max?: number) => {
    if (items.length > 1) {
      return `faker.helpers.arrayElements([${items.join(', ')}])`
    }

    const item = items.at(0)

    if (min !== undefined && max !== undefined) {
      return `faker.helpers.multiple(() => (${item}), { count: { min: ${min}, max: ${max} }})`
    }

    if (min !== undefined) {
      return `faker.helpers.multiple(() => (${item}), { count: ${min} })`
    }

    if (max !== undefined) {
      return `faker.helpers.multiple(() => (${item}), { count: { min: 0, max: ${max} }})`
    }

    return `faker.helpers.multiple(() => (${item}))`
  },
  tuple: (items: Array<string> = []) => `[${items.join(', ')}]`,
  enum: (items: Array<string | number | boolean | undefined> = [], type?: string) =>
    `faker.helpers.arrayElement${type ? `<${type}>` : ''}([${items.join(', ')}])`,
  union: (items: Array<string> = []) => `faker.helpers.arrayElement([${items.join(', ')}])`,
  datetime: () => 'faker.date.anytime().toISOString()',
  date: (representation: 'date' | 'string' = 'string', parser: PluginFaker['resolvedOptions']['dateParser'] = 'faker') => {
    if (representation === 'string') {
      if (parser !== 'faker') {
        return `${parser}(faker.date.anytime()).format("YYYY-MM-DD")`
      }

      return 'faker.date.anytime().toISOString().substring(0, 10)'
    }

    if (parser !== 'faker') {
      throw new Error(`type '${representation}' and parser '${parser}' can not work together`)
    }

    return 'faker.date.anytime()'
  },
  time: (representation: 'date' | 'string' = 'string', parser: PluginFaker['resolvedOptions']['dateParser'] = 'faker') => {
    if (representation === 'string') {
      if (parser !== 'faker') {
        return `${parser}(faker.date.anytime()).format("HH:mm:ss")`
      }

      return 'faker.date.anytime().toISOString().substring(11, 19)'
    }

    if (parser !== 'faker') {
      throw new Error(`type '${representation}' and parser '${parser}' can not work together`)
    }

    return 'faker.date.anytime()'
  },
  uuid: () => 'faker.string.uuid()',
  url: () => 'faker.internet.url()',
  and: (items: Array<string> = []) => {
    if (items.length === 0) {
      return '{}'
    }

    if (items.length === 1) {
      return items[0] ?? '{}'
    }

    return `{...${items.join(', ...')}}`
  },
  matches: (value = '', regexGenerator: 'faker' | 'randexp' = 'faker') => {
    if (regexGenerator === 'randexp') {
      return `${toRegExpString(value, 'RandExp')}.gen()`
    }

    return `faker.helpers.fromRegExp("${value}")`
  },
  email: () => 'faker.internet.email()',
  blob: () => 'faker.image.url() as unknown as Blob',
} as const

function getEnumValues(node: ast.EnumSchemaNode): Array<string | number | boolean | undefined> {
  if (node.namedEnumValues?.length) {
    return node.namedEnumValues.map((item) => item.value as string | number | boolean | undefined)
  }

  return (node.enumValues ?? []) as Array<string | number | boolean | undefined>
}

function parseEnumValue(value: string | number | boolean | undefined) {
  if (typeof value === 'string') {
    return stringify(value)
  }

  return value
}

/**
 * Reads the discriminator literal off a variant, or `undefined` when it can't be determined.
 */
function getDiscriminatorValue(member: ast.SchemaNode, discriminatorPropertyName: string) {
  const prop = ast.narrowSchema(member, 'object')?.properties?.find((p) => p.name === discriminatorPropertyName)
  const enumNode = prop ? ast.narrowSchema(prop.schema, 'enum') : null

  return enumNode ? getEnumValues(enumNode)[0] : undefined
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
      any: () => fakerKeywordMapper.any(),
      unknown: () => fakerKeywordMapper.unknown(),
      void: () => fakerKeywordMapper.void(),
      boolean: () => fakerKeywordMapper.boolean(),
      null: () => fakerKeywordMapper.null(),
      string(node) {
        if (node.pattern) {
          return fakerKeywordMapper.matches(node.pattern, this.options.regexGenerator)
        }

        return fakerKeywordMapper.string(node.min, node.max)
      },
      email: () => fakerKeywordMapper.email(),
      url: () => fakerKeywordMapper.url(),
      uuid: () => fakerKeywordMapper.uuid(),
      number(node) {
        return fakerKeywordMapper.number(node.min, node.max)
      },
      integer(node) {
        return fakerKeywordMapper.integer(node.min, node.max)
      },
      bigint: () => fakerKeywordMapper.bigint(),
      blob: () => fakerKeywordMapper.blob(),
      datetime: () => fakerKeywordMapper.datetime(),
      date(node) {
        return fakerKeywordMapper.date(node.representation ?? 'string', this.options.dateParser)
      },
      time(node) {
        return fakerKeywordMapper.time(node.representation ?? 'string', this.options.dateParser)
      },
      ref(node) {
        // Parser-generated refs (with $ref) carry raw schema names that need resolving.
        // Use the canonical name from the $ref path, since node.name may have been overridden
        // (e.g. by single-member allOf flatten using the property-derived child name).
        // Inline refs (without $ref) from faker utils already carry resolved helper names.
        // `nameMapping` (keyed by the full $ref) carries the collision-resolved name when the
        // referenced component was renamed; otherwise fall back to the short ref name.
        const refName = node.ref
          ? (this.options.nameMapping?.get(node.ref) ?? ast.extractRefName(node.ref) ?? node.name ?? node.schema?.name)
          : (node.name ?? node.schema?.name)

        if (!refName) {
          throw new Error('Name not defined for ref node')
        }

        if (this.options.schemaName && refName === this.options.schemaName) {
          return this.options.typeName ? `undefined as unknown as ${this.options.typeName}` : 'undefined as unknown'
        }

        // Internal helper refs (for generated response/data helpers) are already
        // emitted with resolver output and should not be transformed twice.
        const resolvedName = node.ref ? this.options.resolver.resolveName(refName) : refName

        if (!this.options.nestedInObject) {
          return `${resolvedName}(data)`
        }

        return `${resolvedName}()`
      },
      enum(node) {
        return fakerKeywordMapper.enum(getEnumValues(node).map(parseEnumValue), this.options.typeName)
      },
      union(node): string {
        const { discriminatorPropertyName } = node
        const baseTypeName = this.options.typeName

        const items: Array<string> = ast
          .mapSchemaMembers(node, (member) => {
            // For a discriminated union, narrow each variant to its own branch so nested
            // `NonNullable<T>[K]` indexes resolve against that branch instead of the whole union.
            const value = discriminatorPropertyName ? getDiscriminatorValue(member, discriminatorPropertyName) : undefined

            if (baseTypeName && value !== undefined) {
              const typeName = `Extract<NonNullable<${baseTypeName}>, { ${JSON.stringify(discriminatorPropertyName)}: ${parseEnumValue(value)} }>`

              return printNested(member, { typeName, nestedInObject: true })
            }

            // Without a discriminator, keep the union type but guard each indexed access (see
            // `indexedTypeName`) so a key carried by only some branches resolves to `unknown`
            // rather than erroring with TS2339.
            return printNested(member, { typeName: baseTypeName, nestedInObject: true, nestedInUnion: true })
          })
          .map(({ output }) => output)
          .filter((item): item is string => Boolean(item))

        return fakerKeywordMapper.union(items)
      },
      intersection(node): string {
        const items: Array<string> = ast
          .mapSchemaMembers(node, (member) =>
            printNested(member, {
              nestedInObject: true,
            }),
          )
          .map(({ output }) => output)
          // An `allOf` member with no shape (any/unknown/void → 'undefined') adds no
          // constraint. Keeping it would spread `...undefined` into the merged object.
          .filter((item): item is string => Boolean(item) && item !== 'undefined')

        return fakerKeywordMapper.and(items)
      },
      array(node): string {
        const items: Array<string> = ast
          .mapSchemaItems(node, (member) =>
            printNested(member, {
              typeName: this.options.typeName ? `NonNullable<${this.options.typeName}>[number]` : undefined,
              nestedInObject: true,
            }),
          )
          .map(({ output }) => output)
          .filter((item): item is string => Boolean(item))

        return fakerKeywordMapper.array(items, node.min, node.max)
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

        return fakerKeywordMapper.tuple(items)
      },
      object(node): string {
        const cyclicSchemas = this.options.cyclicSchemas
        const entries = (node.properties ?? []).map((property): string => {
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
          if (cyclicSchemas && ast.containsCircularRef(property.schema, { circularSchemas: cyclicSchemas, excludeName: this.options.schemaName })) {
            return `get ${objectKey(property.name)}() { const _value = ${value}; Object.defineProperty(this, ${JSON.stringify(property.name)}, { value: _value, configurable: true, writable: true, enumerable: true }); return _value }`
          }

          return `${objectKey(property.name)}: ${value}`
        })

        return buildObject(entries)
      },
      ...options.nodes,
    },
    print(node) {
      return this.transform(node) ?? null
    },
  }
})
