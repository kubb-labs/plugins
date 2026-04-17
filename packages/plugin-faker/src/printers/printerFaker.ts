import { stringify, toRegExpString } from '@internals/utils'
import { ast } from '@kubb/core'
import type { PluginFaker, ResolverFaker } from '../types.ts'

export type PrinterFakerNodes = ast.PrinterPartial<string, PrinterFakerOptions>

export type PrinterFakerOptions = {
  dateParser?: PluginFaker['resolvedOptions']['dateParser']
  regexGenerator?: PluginFaker['resolvedOptions']['regexGenerator']
  mapper?: PluginFaker['resolvedOptions']['mapper']
  resolver: ResolverFaker
  typeName?: string
  schemaName?: string
  nestedInObject?: boolean
  nodes?: PrinterFakerNodes
}

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
  array: (items: string[] = [], min?: number, max?: number) => {
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
  tuple: (items: string[] = []) => `[${items.join(', ')}]`,
  enum: (items: Array<string | number | boolean | undefined> = [], type = 'any') => `faker.helpers.arrayElement<${type}>([${items.join(', ')}])`,
  union: (items: string[] = []) => `faker.helpers.arrayElement<any>([${items.join(', ')}])`,
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
  and: (items: string[] = []) => {
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

export const printerFaker: (options: PrinterFakerOptions) => ast.Printer<PrinterFakerFactory> = ast.definePrinter<PrinterFakerFactory>(
  (options) => {
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
          if (!node.name) {
            throw new Error('Name not defined for ref node')
          }

          const refName = node.ref ? (ast.extractRefName(node.ref) ?? node.name) : node.name

          if (this.options.schemaName && refName === this.options.schemaName) {
            return 'undefined as any'
          }

          const resolvedName = this.options.resolver.resolveName(refName)

          if (!this.options.nestedInObject) {
            return `${resolvedName}(data)`
          }

          return `${resolvedName}()`
        },
        enum(node) {
          return fakerKeywordMapper.enum(getEnumValues(node).map(parseEnumValue), this.options.typeName)
        },
        union(node): string {
          const items: string[] = (node.members ?? [])
            .map((member) =>
              printNested(member, {
                nestedInObject: true,
              }),
            )
            .filter((item): item is string => Boolean(item))

          return fakerKeywordMapper.union(items)
        },
        intersection(node): string {
          const items: string[] = (node.members ?? [])
            .map((member) =>
              printNested(member, {
                nestedInObject: true,
              }),
            )
            .filter((item): item is string => Boolean(item))

          return fakerKeywordMapper.and(items)
        },
        array(node): string {
          const items: string[] = (node.items ?? [])
            .map((member) =>
              printNested(member, {
                typeName: this.options.typeName ? `NonNullable<${this.options.typeName}>[number]` : undefined,
                nestedInObject: true,
              }),
            )
            .filter((item): item is string => Boolean(item))

          return fakerKeywordMapper.array(items, node.min, node.max)
        },
        tuple(node): string {
          const items: string[] = (node.items ?? [])
            .map((member) =>
              printNested(member, {
                nestedInObject: true,
              }),
            )
            .filter((item): item is string => Boolean(item))

          return fakerKeywordMapper.tuple(items)
        },
        object(node): string {
          const properties = (node.properties ?? [])
            .map((property): string => {
              if (this.options.mapper && Object.hasOwn(this.options.mapper, property.name)) {
                return `"${property.name}": ${this.options.mapper[property.name]}`
              }

              const value: string =
                printNested(property.schema, {
                  typeName: this.options.typeName ? `NonNullable<${this.options.typeName}>[${JSON.stringify(property.name)}]` : undefined,
                  nestedInObject: true,
                }) ?? 'undefined'

              return `"${property.name}": ${value}`
            })
            .join(',')

          return `{${properties}}`
        },
        ...options.nodes,
      },
      print(node) {
        return this.transform(node) ?? null
      },
    }
  },
)
