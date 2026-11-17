import {
  bigintConstraints,
  defaultLiteral,
  formatDefault,
  integerFormatPattern,
  isObjectComposableIntersection,
  isObjectSchemaNode,
  type NumericConstraints,
  preserveRequiredProperties,
  strictOneOfNode,
} from '@internals/shared'
import { buildList, buildObject, objectKey, toRegExpString } from '@internals/utils'
import { ast, createPrinter, text } from '@kubb/kit'
import type { PluginValibot, ResolverValibot } from '../types.ts'

/**
 * Partial map of node-type overrides for the Valibot printer, keyed by `SchemaType`. Each function
 * replaces the built-in handler and can call `this.transform`, `this.base`, and `this.options`.
 */
export type PrinterValibotNodes = ast.PrinterPartial<string, PrinterValibotOptions>

export type PrinterValibotOptions = {
  /**
   * Output form for an OpenAPI `pattern` inside `v.regex(...)`.
   *
   * @default 'literal'
   */
  regexType?: PluginValibot['resolvedOptions']['regexType']
  /**
   * The adapter's `dateType`. `'stringLocal'` drops the timestamp check, because Valibot has no
   * check for a date-time without an offset.
   */
  dateType?: ast.ParserOptions['dateType']
  /**
   * Turns a schema name from the spec into the name of its generated const.
   */
  resolver?: ResolverValibot
  /**
   * Property names to drop from the printed object with `v.omit(...)`.
   */
  keysToOmit?: Array<string> | null
  /**
   * Schema names that are part of a circular reference. A `$ref` to one of them prints inside
   * `v.lazy(() => ...)`.
   */
  cyclicSchemas?: ReadonlySet<string>
  /**
   * Custom handler map for node type overrides.
   */
  nodes?: PrinterValibotNodes
}

/**
 * Factory options for the Valibot printer: its name, options, and output types.
 */
export type PrinterValibotFactory = ast.PrinterFactoryOptions<'valibot', PrinterValibotOptions, string, string>

type LengthConstraints = { min?: number; max?: number; pattern?: string }

type PrinterContext = { transform: (node: ast.SchemaNode) => string | null }

type ModifierOptions = {
  value: string
  schema: ast.SchemaNode
  nullable?: boolean
  optional?: boolean
  nullish?: boolean
  defaultValue?: unknown
}

const UNKNOWN = 'v.unknown()'

// Actions for string `format`s that Valibot checks with a dedicated action.
const stringFormatActions = new Map<string | undefined, string>([
  ['byte', 'v.base64()'],
  ['base64', 'v.base64()'],
  ['ulid', 'v.ulid()'],
])

function pipe(base: string, actions: Array<string | false | undefined>): string {
  const list = actions.filter(Boolean)

  return list.length ? `v.pipe(${[base, ...list].join(', ')})` : base
}

function lengthActions({ min, max, pattern }: LengthConstraints, regexType: PrinterValibotOptions['regexType']): Array<string> {
  return [
    min !== undefined && `v.minLength(${min})`,
    max !== undefined && `v.maxLength(${max})`,
    pattern !== undefined && `v.regex(${toRegExpString(pattern, regexType === 'constructor' ? 'RegExp' : null)})`,
  ].filter((action): action is string => Boolean(action))
}

function numberActions({ min, max, exclusive, multipleOf }: NumericConstraints, suffix: '' | 'n' = ''): Array<string> {
  return [
    min !== undefined && `v.minValue(${min}${suffix})`,
    max !== undefined && `v.maxValue(${max}${suffix})`,
    exclusive?.min !== undefined && `v.gtValue(${exclusive.min}${suffix})`,
    exclusive?.max !== undefined && `v.ltValue(${exclusive.max}${suffix})`,
    multipleOf !== undefined && `v.multipleOf(${multipleOf}${suffix})`,
  ].filter((action): action is string => Boolean(action))
}

// The actions an `allOf` member adds to a bare string, number, or array. An empty list means the
// member prints as its own schema.
function memberActions(member: ast.SchemaNode, regexType: PrinterValibotOptions['regexType']): Array<string> {
  if (member.primitive === 'string') return lengthActions(ast.schema.narrow(member, 'string') ?? {}, regexType)
  if (member.primitive === 'number' || member.primitive === 'integer') {
    return numberActions(ast.schema.narrow(member, 'number') ?? ast.schema.narrow(member, 'integer') ?? {})
  }
  if (member.primitive === 'array') {
    const array = ast.schema.narrow(member, 'array')
    return array && !array.contains ? lengthActions({ min: array.min, max: array.max }, regexType) : []
  }

  return []
}

function buildLiteral(value: unknown): string {
  if (value === null) return 'v.null()'
  if (Array.isArray(value)) return `v.strictTuple([${value.map((item) => buildLiteral(item)).join(', ')}])`
  if (typeof value === 'object') {
    const properties = Object.entries(value).map(([name, item]) => `${JSON.stringify(name)}: ${buildLiteral(item)}`)
    return `v.strictObject({${properties.join(', ')}})`
  }

  return `v.literal(${formatDefault(value)})`
}

// `v.picklist` takes strings and numbers only, so any other set prints as a union of literals.
function buildEnum(values: Array<unknown>): string {
  if (values.length === 1) return buildLiteral(values[0])
  if (values.every((value) => typeof value === 'string' || typeof value === 'number')) {
    return `v.picklist([${values.map((value) => formatDefault(value)).join(', ')}])`
  }

  return `v.union([${values.map((value) => buildLiteral(value)).join(', ')}])`
}

// A spec default is a string, which does not fit a schema that prints `v.date()`.
function expectsDate(node: ast.SchemaNode): boolean {
  const resolved = ast.ref.mergeSchema(node)

  return (resolved.type === 'date' || resolved.type === 'time') && resolved.representation !== 'string'
}

// Wraps a value in `v.nullable(...)` and `v.optional(...)`. A default goes in as the second argument
// of `v.optional`, so `null` stays `null` and only a missing value takes the default.
function applyModifiers({ value, schema, nullable, optional, nullish, defaultValue }: ModifierOptions): string {
  const inner = nullable || nullish ? `v.nullable(${value})` : value
  const literal = defaultValue !== undefined && !expectsDate(schema) ? defaultLiteral(schema, defaultValue) : null
  if (literal !== null) return `v.optional(${inner}, ${literal})`

  return optional || nullish ? `v.optional(${inner})` : inner
}

// The `.wrapped` chain that reaches the object behind the `v.optional` and `v.nullable` wrappers
// `applyModifiers` puts on the const a `$ref` resolves to.
function unwrapChain(node: ast.SchemaNode): string {
  const ref = ast.schema.narrow(node, 'ref')
  if (!ref) return ''
  const target = ref.schema ?? ref
  const hasDefault = target.default !== undefined && !expectsDate(target) && defaultLiteral(target, target.default) !== null
  const depth = Number(Boolean(target.nullable || target.nullish)) + Number(Boolean(target.optional || target.nullish || hasDefault))

  return '.wrapped'.repeat(depth)
}

function objectEntries(ctx: PrinterContext, properties: Array<ast.PropertyNode>): Array<string> {
  return properties.map(({ name, schema, required }) => {
    const meta = ast.ref.mergeSchema(schema)
    const value = applyModifiers({
      value: ctx.transform(schema) ?? UNKNOWN,
      schema,
      nullable: meta.nullable,
      optional: schema.optional || required === false,
      nullish: schema.nullish,
      defaultValue: meta.default,
    })

    return `${objectKey(name)}: ${value}`
  })
}

// Makes a `$ref` member of a `oneOf` strict, so a value with the keys of another member does not
// match it. Only a const that holds a plain object schema has the `.entries` this reads.
function strictMember({ member, node, cyclicSchemas }: { member: string; node: ast.SchemaNode; cyclicSchemas?: ReadonlySet<string> }): string {
  if (node.type !== ast.schema.types.ref) return member
  const refName = ast.ref.getName(node)
  if (refName && cyclicSchemas?.has(refName)) return member

  const schema = ast.ref.mergeSchema(node)
  const isWrapped = schema.nullable || schema.optional || schema.nullish || schema.default !== undefined || node.nullable || node.optional
  const isPlainObject =
    schema.type === ast.schema.types.object &&
    (schema.additionalProperties === undefined || schema.additionalProperties === false) &&
    !schema.patternProperties &&
    !schema.propertyNames

  return isPlainObject && !isWrapped ? `v.strictObject(${member}.entries)` : member
}

/**
 * Valibot v1 printer. Turns a `SchemaNode` into the code of a Valibot schema.
 *
 * @example
 * ```ts
 * const printer = printerValibot({})
 *
 * printer.print(ast.factory.createSchema({ type: 'string', min: 1 })) // 'v.pipe(v.string(), v.minLength(1))'
 * ```
 */
export const printerValibot = createPrinter<PrinterValibotFactory>((options) => {
  // Read once: `isObjectSchemaNode` and `strictMember` need the full set for every node.
  const { cyclicSchemas } = options
  // A const whose schema carries a `default` is a `v.optional(...)` wrapper, which has no `.entries`.
  const isObjectNode = (node: ast.SchemaNode) => isObjectSchemaNode(node, cyclicSchemas) && ast.ref.mergeSchema(node).default === undefined
  const unionsWithSiblings = new WeakSet<ast.SchemaNode>()
  // An OpenAPI 3.0 `nullable: true` set on an array item or union member, which only a property or a root applies.
  const printNullable = (schema: ast.SchemaNode, output: string | null) => (output && schema.nullable ? `v.nullable(${output})` : output)
  const formatString = (action: string, node: LengthConstraints) => pipe('v.string()', [action, ...lengthActions(node, options.regexType)])

  const nodes: PrinterValibotNodes = {
    any: () => 'v.any()',
    unknown: () => UNKNOWN,
    void: () => 'v.void()',
    never: () => 'v.never()',
    boolean: () => 'v.boolean()',
    null: () => 'v.null()',
    blob: () => 'v.blob()',
    ipv4: () => 'v.pipe(v.string(), v.ipv4())',
    ipv6: () => 'v.pipe(v.string(), v.ipv6())',
    string(node) {
      const format = stringFormatActions.get(node.format) ?? (node.content?.encoding?.toLowerCase() === 'base64' ? 'v.base64()' : undefined)
      const pattern = node.pattern ?? integerFormatPattern(node.format)

      return pipe('v.string()', [format, ...lengthActions({ ...node, pattern }, this.options.regexType)])
    },
    uuid: (node) => formatString('v.uuid()', node),
    email: (node) => formatString('v.email()', node),
    url: (node) => formatString('v.url()', node),
    number(node) {
      return pipe('v.number()', numberActions(node))
    },
    integer(node) {
      return pipe('v.number()', ['v.integer()', ...numberActions(node)])
    },
    bigint(node) {
      // JSON carries a 64-bit integer as a number or a string, so both convert.
      return pipe('v.union([v.bigint(), v.number(), v.string()])', ['v.toBigint()', ...numberActions(bigintConstraints(node), 'n')])
    },
    date(node) {
      return node.representation === 'date' ? 'v.date()' : 'v.pipe(v.string(), v.isoDate())'
    },
    datetime(node) {
      // `v.isoTimestamp()` needs a `Z` or an offset, so a local date-time stays an unchecked string.
      const isLocal = node.local || this.options.dateType === 'stringLocal'

      return isLocal ? 'v.string()' : 'v.pipe(v.string(), v.isoTimestamp())'
    },
    time(node) {
      // Valibot's time actions reject fractional seconds and offsets, which an OpenAPI `time` allows.
      return node.representation === 'string' ? 'v.string()' : 'v.date()'
    },
    enum(node) {
      return buildEnum(ast.schema.getLiterals(node).filter((value) => value !== null))
    },
    ref(node) {
      if (!node.name) return null
      const refName = ast.ref.getName(node)
      if (!refName) return null
      const resolvedName = node.ref ? (this.options.resolver?.name(refName) ?? refName) : node.name

      return node.ref && cyclicSchemas?.has(refName) ? `v.lazy(() => ${resolvedName})` : resolvedName
    },
    object(node) {
      const hasProperties = node.properties.length > 0
      const patterns = node.patternProperties ? Object.entries(node.patternProperties) : []
      const shape = buildObject(objectEntries(this, node.properties))
      const keySchema = node.propertyNames ? this.transform(node.propertyNames) : null
      // `additionalProperties: false` still permits patternProperties keys, so only a pattern-free object is strict.
      const isStrict = node.additionalProperties === false && patterns.length === 0

      if (node.additionalProperties && node.additionalProperties !== true) {
        const rest = this.transform(node.additionalProperties)
        if (rest) return hasProperties ? `v.objectWithRest(${shape}, ${rest})` : `v.record(${keySchema ?? 'v.string()'}, ${rest})`
      }
      if (isStrict) return `v.strictObject(${shape})`
      if (!hasProperties && patterns.length === 0 && keySchema) return `v.record(${keySchema}, ${UNKNOWN})`
      if (node.additionalProperties === true) return `v.looseObject(${shape})`

      if (patterns.length > 0) {
        const values = [...new Set(patterns.map(([, schema]) => printNullable(schema, this.transform(schema) ?? UNKNOWN)!))]
        const value = values.length === 1 ? values[0]! : `v.union(${buildList(values)})`
        // With fixed properties a record would reject the declared keys, so the rest schema checks the value only.
        if (hasProperties) return `v.objectWithRest(${shape}, ${value})`
        const keyPattern = patterns.length === 1 ? patterns[0]![0] : patterns.map(([pattern]) => `(${pattern})`).join('|')

        return `v.record(${pipe('v.string()', lengthActions({ pattern: keyPattern }, this.options.regexType))}, ${value})`
      }

      return `v.object(${shape})`
    },
    array(node) {
      const items = (node.items ?? []).map((item) => printNullable(item, this.transform(item))).filter((item): item is string => Boolean(item))
      const inner = items.length > 1 ? `v.union(${buildList(items)})` : (items[0] ?? UNKNOWN)

      return pipe(`v.array(${inner})`, [
        ...lengthActions({ min: node.min, max: node.max }, this.options.regexType),
        node.unique && 'v.check((items) => new Set(items).size === items.length, "Array entries must be unique")',
      ])
    },
    tuple(node) {
      const items = buildList((node.items ?? []).map((item) => printNullable(item, this.transform(item))).filter((item): item is string => Boolean(item)))
      // OpenAPI 3.1 `items` next to `prefixItems` types the elements after the positional ones.
      const rest = node.rest ? this.transform(node.rest) : null

      return rest ? `v.tupleWithRest(${items}, ${rest})` : `v.tuple(${items})`
    },
    union(node) {
      const nodeMembers = node.members ?? []
      const { discriminatorPropertyName } = node
      // `v.variant` takes object schemas only. Intersections, wrapped objects, and `v.lazy` refs fall back to `v.union`.
      const isDiscriminated = !!discriminatorPropertyName && nodeMembers.every(isObjectNode)
      // `v.union` returns the first member that matches, and an object member drops the keys it does not
      // know. A strict member rejects those keys instead, so a `oneOf` value reaches the member it belongs to.
      const isStrict = node.strategy === 'one' && !isDiscriminated && !unionsWithSiblings.has(node)
      const members = nodeMembers
        .map((member) => {
          const output = this.transform(isStrict ? strictOneOfNode(member) : member)
          return printNullable(member, output && isStrict ? strictMember({ member: output, node: member, cyclicSchemas }) : output)
        })
        .filter((member): member is string => Boolean(member))

      if (members.length === 0) return ''
      if (members.length === 1) return members[0]!

      return isDiscriminated ? `v.variant(${text.quote(discriminatorPropertyName)}, ${buildList(members)})` : `v.union(${buildList(members)})`
    },
    intersection(node) {
      const members = node.members ?? []
      const [first, ...rest] = members
      if (!first) return ''
      // A union next to sibling properties shares its value with them, so its members cannot be strict.
      const hasSiblingProperties = members.some((member) => member.type === ast.schema.types.object && member.properties.length > 0)
      const transform = (member: ast.SchemaNode) => {
        if (!hasSiblingProperties) return this.transform(member)
        unionsWithSiblings.add(member)
        try {
          return this.transform(member)
        } finally {
          unionsWithSiblings.delete(member)
        }
      }

      const firstBase = transform(first)
      if (!firstBase) return ''

      // An object `allOf` is a merge: one `v.object` with the entries of every member stays usable in `v.variant` and `v.omit`.
      const base = ast.ref.mergeSchema(first)
      const baseObject = ast.schema.narrow(base, ast.schema.types.object)
      // A rest schema or a key pattern cannot move into the merged object, so that base stays in `v.intersect`.
      const hasRest =
        Boolean(baseObject?.patternProperties) || (baseObject?.additionalProperties !== undefined && typeof baseObject.additionalProperties !== 'boolean')
      if (rest.length > 0 && !hasRest && isObjectNode(first) && isObjectComposableIntersection(node, cyclicSchemas)) {
        // A discriminated `oneOf` base already pins its discriminator to a literal, which a sibling `type: string` would widen.
        const discriminator = ast.schema.narrow(first, ast.schema.types.union)?.discriminatorPropertyName
        // Keyed by name: a property two members declare is one key of the object literal, and the last member wins.
        const properties = new Map(
          preserveRequiredProperties(members)
            .slice(1)
            .flatMap((member) => ast.schema.narrow(member, ast.schema.types.object)?.properties ?? [])
            .filter((property) => property.name !== discriminator)
            .map((property) => [property.name, property] as const),
        )

        const additional = baseObject?.additionalProperties
        const ctor = additional === true ? 'v.looseObject' : additional === false ? 'v.strictObject' : 'v.object'

        return `${ctor}(${buildObject([`...${firstBase}.entries`, ...objectEntries(this, [...properties.values()])])})`
      }

      const schemas = [firstBase]
      const actions: Array<string> = []
      for (const member of rest) {
        const constraints = memberActions(member, this.options.regexType)
        const transformed = constraints.length ? null : transform(member)
        actions.push(...constraints)
        if (transformed) schemas.push(transformed)
      }

      return pipe(schemas.length > 1 ? `v.intersect(${buildList(schemas)})` : firstBase, actions)
    },
  }

  return {
    name: 'valibot',
    options,
    nodes,
    overrides: options.nodes,
    print(node) {
      const transformed = this.transform(node)
      if (!transformed) return null

      const { keysToOmit } = this.options
      const meta = ast.ref.mergeSchema(node)
      // A `v.lazy` ref is typed as `v.GenericSchema`, which `v.omit` does not take, so a circular schema keeps every key.
      const canOmit =
        keysToOmit?.length && meta.primitive === 'object' && !(meta.type === 'union' && meta.discriminatorPropertyName) && !transformed.startsWith('v.lazy(')
      const value = canOmit ? `v.omit(${transformed}${unwrapChain(node)}, [${keysToOmit.map((key) => text.quote(key)).join(', ')}])` : transformed

      return applyModifiers({ value, schema: node, nullable: meta.nullable, optional: meta.optional, nullish: meta.nullish, defaultValue: meta.default })
    },
  }
})
