import { ast } from '@internals/ast'
import {
  defaultLiteral,
  formatDefault,
  getChecks,
  getObjectKind,
  isComposedObject,
  integerFormatPattern,
  type NumericBounds,
  numericLiteral,
  preserveRequiredProperties,
  shouldCoerce,
  strictOneOfNode,
  withFormatRange,
} from '@internals/shared'
import { buildList, buildObject, objectKey, toRegExpString } from '@internals/utils'
import { createPrinter, text } from '@kubb/kit'
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
   * How a `oneOf` without a discriminator is validated: strict members, or exactly one match.
   *
   * @default 'union'
   */
  oneOfType?: PluginValibot['resolvedOptions']['oneOfType']
  /**
   * Convert input before validation: `v.toString()`, `v.toNumber()`, and `v.toDate()`.
   *
   * @default false
   */
  coercion?: PluginValibot['resolvedOptions']['coercion']
  /**
   * Which way a node converts between its wire type and its runtime type:
   * - `'decode'` (default): wire into runtime, used by response schemas.
   * - `'encode'`: runtime back to wire, used by request bodies and parameters.
   *
   * A handler that returns different output per direction makes the generator emit an
   * `${name}InputSchema` variant for that component.
   */
  direction?: 'encode' | 'decode'
  /**
   * Turns a schema name from the spec into the name of its generated const.
   */
  resolver?: ResolverValibot
  /**
   * Caches the directional-node lookups of `containsDirectionalNode`. The `setPrinter` factory creates
   * one per printer, so the cache lives as long as that printer. Without it, nothing is cached.
   */
  directionalCache?: WeakMap<ast.SchemaNode, ast.SchemaNode | null>
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

type PrinterContext = { transform: (node: ast.SchemaNode) => string | null; options: PrinterValibotOptions }

type ModifierOptions = {
  value: string
  schema: ast.SchemaNode
  nullable?: boolean
  optional?: boolean
  nullish?: boolean
  defaultValue?: unknown
  title?: string
  description?: string
  examples?: Array<unknown>
  direction?: PrinterValibotOptions['direction']
}

const UNKNOWN = 'v.unknown()'

// A check on the raw input skips every value that is not a plain object.
const NOT_OBJECT = 'typeof value !== "object" || value === null || Array.isArray(value)'

// Actions for string `format`s that Valibot checks with a dedicated action.
const stringFormatActions = new Map<string | undefined, string>([
  ['byte', 'v.base64()'],
  ['base64', 'v.base64()'],
  ['ulid', 'v.ulid()'],
])

function pipe(base: string, actions: Array<string | false | null | undefined>): string {
  const list = actions.filter(Boolean)

  return list.length ? `v.pipe(${[base, ...list].join(', ')})` : base
}

// The `v.check` action of a `not` schema: the value must fail the schema `not` holds. Valibot has no negation schema.
function notCheck(ctx: { transform: (node: ast.SchemaNode) => string | null | undefined }, node: ast.SchemaNode): string | null {
  const [member] = ast.schema.narrow(node, ast.schema.types.not)?.members ?? []
  const schema = member ? ctx.transform(member) : null
  return schema ? `v.check((value) => !v.is(${schema}, value), "Value must not match the schema")` : null
}

function lengthActions({ min, max, pattern }: LengthConstraints, regexType: PrinterValibotOptions['regexType']): Array<string> {
  return [
    min !== undefined && `v.minLength(${min})`,
    max !== undefined && `v.maxLength(${max})`,
    pattern !== undefined && `v.regex(${toRegExpString(pattern, regexType === 'constructor' ? 'RegExp' : null)})`,
  ].filter((action): action is string => Boolean(action))
}

function numberActions({ min, max, exclusive, multipleOf }: NumericBounds, isBigint = false): Array<string> {
  const literal = (value: number | string) => numericLiteral(value, isBigint)

  return [
    min !== undefined && `v.minValue(${literal(min)})`,
    max !== undefined && `v.maxValue(${literal(max)})`,
    exclusive?.min !== undefined && `v.gtValue(${literal(exclusive.min)})`,
    exclusive?.max !== undefined && `v.ltValue(${literal(exclusive.max)})`,
    multipleOf !== undefined && `v.multipleOf(${literal(multipleOf)})`,
  ].filter((action): action is string => Boolean(action))
}

// The actions an `allOf` member adds to a bare string, number, or array. An empty list means the
// member prints as its own schema.
function memberActions({
  member,
  base,
  regexType,
}: {
  member: ast.SchemaNode
  base: ast.SchemaNode
  regexType: PrinterValibotOptions['regexType']
}): Array<string> {
  // Checks on the raw input cannot ride along as actions, so that member prints as its own schema.
  if (hasChecks(member)) return []
  if (member.primitive === 'string') return lengthActions(ast.schema.narrow(member, 'string') ?? {}, regexType)
  if (member.primitive === 'number' || member.primitive === 'integer') {
    const numeric = ast.schema.narrow(member, 'number') ?? ast.schema.narrow(member, 'integer') ?? {}
    // The base decides the value the bounds compare with: a bigint base takes bigint bounds.
    if (base.type === ast.schema.types.bigint) return numberActions(ast.schema.getNumberBounds({ ...numeric, format: undefined, integer: true }), true)

    return [...(member.primitive === 'integer' && base.type !== ast.schema.types.integer ? ['v.integer()'] : []), ...numberActions(numeric)]
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

// A spec default is a string, which does not fit an encode schema that takes a `Date`.
function expectsDate(node: ast.SchemaNode, direction: PrinterValibotOptions['direction']): boolean {
  const resolved = ast.ref.mergeSchema(node)

  return direction === 'encode' && (resolved.type === 'date' || resolved.type === 'time') && resolved.representation !== 'string'
}

const hasChecks = (node: ast.SchemaNode) => getChecks(node).length > 0

// Wraps a value in `v.nullable(...)` and `v.optional(...)`. A default goes in as the second argument
// of `v.optional`, so `null` stays `null` and only a missing value takes the default.
function applyModifiers({ value, schema, nullable, optional, nullish, defaultValue, title, description, examples, direction }: ModifierOptions): string {
  const metadata = [
    title && `v.title(${text.quote(title)})`,
    description && `v.description(${text.quote(description)})`,
    // `v.examples()` is typed against the schema, so an example of the wrong type in the spec would not compile.
    examples?.length && `v.metadata({ examples: [${examples.map((example) => (example === null ? 'null' : formatDefault(example))).join(', ')}] })`,
  ].filter(Boolean)
  // Always its own `v.pipe`, so `.pipe[0]` is the schema without the metadata.
  const described = metadata.length ? `v.pipe(${value}, ${metadata.join(', ')})` : value
  const inner = nullable || nullish ? `v.nullable(${described})` : described
  const literal = defaultValue !== undefined && !expectsDate(schema, direction) ? defaultLiteral(schema, defaultValue) : null
  if (literal !== null) return `v.optional(${inner}, ${literal})`

  return optional || nullish ? `v.optional(${inner})` : inner
}

// A `$ref` const prints without the metadata of its target, so `print` and `unwrapChain` agree on the shape.
function hasMetadata(node: ast.SchemaNode): boolean {
  return node.type !== ast.schema.types.ref && Boolean(node.title || node.description || node.examples?.length)
}

// The `.wrapped` chain that reaches the object behind the `v.optional` and `v.nullable` wrappers
// `applyModifiers` puts on the const a `$ref` resolves to.
function unwrapChain(node: ast.SchemaNode, direction: PrinterValibotOptions['direction']): string {
  const ref = ast.schema.narrow(node, 'ref')
  if (!ref) return ''
  const target = ref.schema ?? ref
  // `print` reads the modifiers of a const from its merged schema, so an alias of a nullable schema is nullable twice.
  const meta = ast.ref.mergeSchema(target)
  const hasDefault = meta.default !== undefined && !expectsDate(target, direction) && defaultLiteral(target, meta.default) !== null
  const depth = Number(Boolean(meta.nullable || meta.nullish)) + Number(Boolean(meta.optional || meta.nullish || hasDefault))
  // An alias const wraps the const it points to, so the chain goes on through it.
  const inner = target !== ref && target.type === ast.schema.types.ref ? unwrapChain(target, direction) : ''

  // `v.omit` and the other object helpers do not take a schema with a pipe.
  return `${'.wrapped'.repeat(depth)}${inner}${hasMetadata(target) ? '.pipe[0]' : ''}`
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
      // A property that replaces a `$ref`, such as a discriminator, does not take the description of the target.
      title: schema.type === ast.schema.types.ref ? undefined : schema.title,
      description: schema.type !== ast.schema.types.ref && meta.type === ast.schema.types.ref ? undefined : meta.description,
      examples: meta.examples,
      direction: ctx.options.direction,
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
    !schema.propertyNames &&
    !hasChecks(schema)

  return isPlainObject && !isWrapped ? `v.strictObject(${member}.entries)` : member
}

function containsCheck(ctx: PrinterContext, { schema, min = 1, max }: NonNullable<ast.ArraySchemaNode['contains']>): string | false {
  if (min === 0 && max === undefined) return false
  const bounds = [`count >= ${min}`, max !== undefined && `count <= ${max}`].filter(Boolean).join(' && ')
  const message = max !== undefined ? `Array must contain ${min} to ${max} matching items` : `Array must contain at least ${min} matching items`

  return `v.check((items) => { const count = items.filter((item) => v.is(${ctx.transform(schema) ?? UNKNOWN}, item)).length; return ${bounds} }, ${JSON.stringify(message)})`
}

// A required `unknown` property means "the key is present", which an object schema accepts as missing, so those keys are checked with `in`.
function conditionExpression(ctx: PrinterContext, schema: ast.SchemaNode | undefined): string {
  if (!schema) return 'true'
  const object = ast.schema.narrow(schema, ast.schema.types.object)
  const keyOnlyNames =
    object?.properties.filter((property) => property.required && property.schema.type === ast.schema.types.unknown).map((property) => property.name) ?? []
  const restSchema = object ? { ...object, properties: object.properties.filter((property) => !keyOnlyNames.includes(property.name)) } : schema
  // An object with no properties left still means "is an object", so only a key check stands alone.
  const isOnlyKeys =
    keyOnlyNames.length > 0 &&
    restSchema.type === 'object' &&
    restSchema.properties.length === 0 &&
    restSchema.additionalProperties === undefined &&
    !restSchema.patternProperties &&
    !restSchema.propertyNames &&
    !hasChecks(restSchema)

  return [
    keyOnlyNames.length > 0 && `typeof value === "object" && value !== null && ${JSON.stringify(keyOnlyNames)}.every((key) => key in value)`,
    !isOnlyKeys && `v.is(${ctx.transform(restSchema) ?? UNKNOWN}, value)`,
  ]
    .filter(Boolean)
    .join(' && ')
}

// The `v.check` actions that run on the raw input, before an object schema drops unknown keys or fills in defaults.
function inputChecks(ctx: PrinterContext, node: ast.SchemaNode): Array<string> {
  const { min, max } = node.type === 'object' ? node : {}
  const checks = getChecks(node)
  const keyCheck = checks.find((check) => check.kind === 'propertyNames')
  const patternCheck = checks.find((check) => check.kind === 'patternProperties')
  const keySchema = keyCheck ? ctx.transform(keyCheck.schema) : null
  const patternKeys = patternCheck
    ? `${JSON.stringify(ast.schema.narrow(node, 'object')!.properties.map((property) => property.name))}.includes(key) || ${Object.keys(patternCheck.patterns)
        .map((pattern) => `${toRegExpString(pattern, ctx.options.regexType === 'constructor' ? 'RegExp' : null)}.test(key)`)
        .join(' || ')}`
    : null

  return [
    min !== undefined && `v.check((value) => ${NOT_OBJECT} || Object.keys(value).length >= ${min}, "Object must have at least ${min} properties")`,
    max !== undefined && `v.check((value) => ${NOT_OBJECT} || Object.keys(value).length <= ${max}, "Object must have at most ${max} properties")`,
    keySchema &&
      `v.check((value) => ${NOT_OBJECT} || Object.keys(value).every((key) => v.is(${keySchema}, key)), "Object keys must match the property names schema")`,
    patternKeys && `v.check((value) => ${NOT_OBJECT} || Object.keys(value).every((key) => ${patternKeys}), "Object keys must be declared or match a pattern")`,
    ...(node.conditionals ?? []).map(
      (entry) =>
        `v.check((value) => (${conditionExpression(ctx, entry.if)} ? ${conditionExpression(ctx, entry.then)} : ${conditionExpression(ctx, entry.else)}), "Value does not meet a conditional schema")`,
    ),
  ].filter((check): check is string => Boolean(check))
}

type Handler<K extends ast.SchemaType> = (this: ThisParameterType<NonNullable<PrinterValibotNodes['any']>>, node: ast.SchemaNodeByType[K]) => string | null

// Wraps each handler so its output first checks the raw input: `v.pipe(v.unknown(), ...checks, schema)`.
function withInputChecks(nodes: PrinterValibotNodes, isSkipped: (node: ast.SchemaNode) => boolean): PrinterValibotNodes {
  const wrapHandler = <K extends ast.SchemaType>(type: K): Array<[K, Handler<K>]> => {
    const handler: Handler<K> | undefined = nodes[type]
    if (!handler) return []
    const checkedHandler: Handler<K> = function (node) {
      const output = handler.call(this, node)
      if (!output || isSkipped(node) || !hasChecks(node)) return output

      return pipe(UNKNOWN, [...inputChecks(this, node), output])
    }
    return [[type, checkedHandler]]
  }

  return Object.fromEntries(Object.values(ast.schema.types).flatMap(wrapHandler))
}

/**
 * The handlers that print differently per direction. `date` and `time` decode a wire string into a
 * `Date` on responses and encode it back on requests. Only `representation: 'date'` fields convert.
 * `time` has no date part, so it decodes onto `1970-01-01` and encodes back to `HH:mm:ssZ`, with milliseconds when it has them.
 */
const directionalNodes: PrinterValibotNodes = {
  date(node) {
    if (node.representation !== 'date') return 'v.pipe(v.string(), v.isoDate())'
    if (this.options.direction === 'encode') {
      return node.format === 'date'
        ? 'v.pipe(v.date(), v.transform((value) => value.toISOString().slice(0, 10)))'
        : 'v.pipe(v.date(), v.transform((value) => value.toISOString()))'
    }
    if (shouldCoerce(this.options.coercion, 'dates')) return 'v.pipe(v.unknown(), v.toDate())'

    return node.format === 'date'
      ? 'v.pipe(v.string(), v.isoDate(), v.transform((value) => new Date(value)))'
      : 'v.pipe(v.string(), v.isoTimestamp(), v.transform((value) => new Date(value)))'
  },
  time(node) {
    // Valibot's time actions reject fractional seconds, which an OpenAPI `time` allows, so a time string stays unchecked.
    if (node.representation === 'string') return 'v.string()'
    // An OpenAPI `time` is an RFC 3339 full-time: it ends in `Z` or an offset, and can carry milliseconds.
    if (this.options.direction === 'encode') return 'v.pipe(v.date(), v.transform((value) => value.toISOString().slice(11).replace(".000Z", "Z")))'

    // A time without an offset is read as UTC. The trailing `v.date()` rejects the Invalid Date a malformed time turns into.
    return 'v.pipe(v.string(), v.transform((value) => new Date(`1970-01-01T${value}${/(?:z|[+-]\\d{2}:\\d{2})$/i.test(value) ? "" : "Z"}`)), v.date())'
  },
}

type DirectionProbeContext = { options: PrinterValibotOptions; transform: () => null; base: () => null; import: () => void }

// Runs the handler of a node once per direction and reports whether the two outputs differ.
function variesByDirection({ node, printerOptions }: { node: ast.SchemaNode; printerOptions: PrinterValibotOptions }): boolean {
  const handler = printerOptions.nodes?.[node.type] ?? directionalNodes[node.type]
  if (!handler) return false

  const call = (direction: 'encode' | 'decode') => {
    const context: DirectionProbeContext = { options: { ...printerOptions, direction }, transform: () => null, base: () => null, import: () => {} }
    return (handler as (this: DirectionProbeContext, node: ast.SchemaNode) => string | null).call(context, node)
  }

  return call('decode') !== call('encode')
}

/**
 * Whether the schema contains a node that prints differently per direction, so it decodes on
 * responses and encodes on requests. Follows a `$ref` through its resolved schema.
 */
export function containsDirectionalNode({ node, printerOptions }: { node: ast.SchemaNode | undefined; printerOptions: PrinterValibotOptions }): boolean {
  if (!node) return false
  return (
    ast.schema.find(node, {
      predicate: (schema) => variesByDirection({ node: schema, printerOptions }),
      follow: ['ref'],
      cache: printerOptions.directionalCache,
    }) !== undefined
  )
}

/**
 * Names of the `$ref` schemas a request schema reads from their `${name}InputSchema` variant.
 */
export function collectDirectionalRefNames({ node, printerOptions }: { node: ast.SchemaNode; printerOptions: PrinterValibotOptions }): Array<string> {
  return ast.node.collect<string>(node, {
    schema: (n) =>
      n.type === ast.schema.types.ref && n.ref && containsDirectionalNode({ node: n, printerOptions }) ? (ast.ref.getName(n) ?? undefined) : undefined,
  })
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
  // Read once: `getObjectKind` and `strictMember` need the full set for every node.
  const { cyclicSchemas } = options
  // A const whose schema carries a `default` is a `v.optional(...)` wrapper, which has no `.entries`.
  const isObjectNode = (node: ast.SchemaNode) => {
    const resolved = ast.ref.mergeSchema(node)
    const kind = getObjectKind(node, { circularSchemas: cyclicSchemas })
    return kind !== null && kind !== 'record' && resolved.default === undefined && !getChecks(resolved).some((check) => check.kind === 'patternProperties')
  }
  // The node `print` reads without its input checks, because `v.omit` needs the bare object. Nested nodes keep theirs.
  let uncheckedNode: ast.SchemaNode | null = null
  // An OpenAPI 3.0 `nullable: true` set on an array item or union member, which only a property or a root applies.
  const printNullable = (schema: ast.SchemaNode, output: string | null) => (output && schema.nullable ? `v.nullable(${output})` : output)
  const formatString = (action: string, node: LengthConstraints) => pipe('v.string()', [action, ...lengthActions(node, options.regexType)])

  // Whether an `allOf` prints as one `v.object` with the entries of every member, and not as `v.intersect`.
  const mergesToObject = (node: ast.SchemaNode): boolean => {
    const [first, ...rest] = ast.schema.narrow(node, ast.schema.types.intersection)?.members ?? []
    if (!first || rest.length === 0) return false
    const baseObject = ast.schema.narrow(ast.ref.mergeSchema(first), ast.schema.types.object)
    // A rest schema or a key pattern cannot move into the merged object, so that base stays in `v.intersect`.
    const hasRest =
      Boolean(baseObject?.patternProperties) || (baseObject?.additionalProperties !== undefined && typeof baseObject.additionalProperties !== 'boolean')

    return !hasRest && isObjectNode(first) && isComposedObject(node, { circularSchemas: cyclicSchemas })
  }
  // Whether the schema prints with `.entries`, which `v.omit` reads. A `v.union` and a `v.intersect` have none.
  const printsEntries = (node: ast.SchemaNode): boolean => {
    const ref = ast.schema.narrow(node, ast.schema.types.ref)
    if (ref?.schema && ref.schema !== ref) return printsEntries(ref.schema)
    // An unresolved ref has no schema to read, so it counts as an object, as it does for `v.variant`.
    if (ref) return true

    return node.type === ast.schema.types.object ? node.properties.length > 0 : mergesToObject(node)
  }

  // Prints the schema without `keysToOmit`. `v.omit` takes a bare object schema, so each wrapper is peeled off first.
  function omitKeys(this: PrinterContext, { node, transformed, keysToOmit }: { node: ast.SchemaNode; transformed: string; keysToOmit: Array<string> }): string {
    const target = ast.schema.narrow(node, 'ref')?.schema ?? node
    const keys = `[${keysToOmit.map((key) => text.quote(key)).join(', ')}]`

    // A circular const is typed `v.GenericSchema`, which `v.omit` does not take. The generator prints that object inline.
    if (transformed.startsWith('v.lazy(')) return transformed
    const base = `${transformed}${unwrapChain(node, this.options.direction)}`
    if (!hasChecks(target)) return `v.omit(${base}, ${keys})`
    // `withInputChecks` printed `v.pipe(v.unknown(), ...checks, object)`. `v.omit` takes the object only, so the checks go back around it.
    if (node.type === ast.schema.types.ref) {
      const count = getChecks(target).length
      const checks = Array.from({ length: count }, (_, index) => `${base}.pipe[${index + 1}]`)

      return pipe(UNKNOWN, [...checks, `v.omit(${base}.pipe[${count + 1}], ${keys})`])
    }

    uncheckedNode = node
    try {
      return pipe(UNKNOWN, [...inputChecks(this, node), `v.omit(${this.transform(node)}, ${keys})`])
    } finally {
      uncheckedNode = null
    }
  }

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
      const coerce = shouldCoerce(this.options.coercion, 'strings')
      const format = stringFormatActions.get(node.format) ?? (node.content?.encoding?.toLowerCase() === 'base64' ? 'v.base64()' : undefined)
      const pattern = node.pattern ?? integerFormatPattern(node.format)
      const actions = [coerce && 'v.toString()', format, ...lengthActions({ ...node, pattern }, this.options.regexType)]

      const contentNode = ast.schema.getEmbeddedJson(node)
      if (!contentNode) return pipe(coerce ? UNKNOWN : 'v.string()', actions)
      // The string holds wire JSON whichever way the string itself travels, so its schema always decodes.
      const { direction } = this.options
      this.options.direction = 'decode'
      let content: string | null
      try {
        content = this.transform(contentNode)
      } finally {
        this.options.direction = direction
      }

      return pipe(coerce ? UNKNOWN : 'v.string()', [
        ...actions,
        content &&
          `v.check((value) => { try { return v.is(${content}, JSON.parse(value)) } catch { return false } }, "String must hold JSON that matches its content schema")`,
      ])
    },
    uuid: (node) => formatString('v.uuid()', node),
    email: (node) => formatString('v.email()', node),
    url: (node) => formatString('v.url()', node),
    number(node) {
      const coerce = shouldCoerce(this.options.coercion, 'numbers')

      return pipe(coerce ? UNKNOWN : 'v.number()', [coerce && 'v.toNumber()', ...numberActions(node)])
    },
    integer(node) {
      const coerce = shouldCoerce(this.options.coercion, 'numbers')

      return pipe(coerce ? UNKNOWN : 'v.number()', [coerce && 'v.toNumber()', 'v.integer()', ...numberActions(withFormatRange(node, 'integer'))])
    },
    bigint(node) {
      // JSON carries a 64-bit integer as a number or a string, so both convert.
      return pipe('v.union([v.bigint(), v.number(), v.string()])', [
        'v.toBigint()',
        ...numberActions(withFormatRange({ ...ast.schema.getNumberBounds(node), format: node.format }, 'bigint'), true),
      ])
    },
    ...directionalNodes,
    datetime(node) {
      // `v.isoTimestamp()` needs a `Z` or an offset, so a local date-time stays an unchecked string.
      const isLocal = node.local

      return isLocal ? 'v.string()' : 'v.pipe(v.string(), v.isoTimestamp())'
    },
    enum(node) {
      return buildEnum(ast.schema.getLiterals(node).filter((value) => value !== null))
    },
    ref(node) {
      if (!node.name) return null
      const refName = ast.ref.getName(node)
      if (!refName) return null
      // A request schema reads a component with a direction-dependent field from its `${name}InputSchema` variant.
      const useInputVariant = node.ref != null && this.options.direction === 'encode' && containsDirectionalNode({ node, printerOptions: this.options })
      const resolver = this.options.resolver
      const resolvedName = node.ref ? ((useInputVariant ? resolver?.schema.inputName(refName) : resolver?.name(refName)) ?? refName) : node.name

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
        node.contains && containsCheck(this, node.contains),
      ])
    },
    tuple(node) {
      const items = buildList((node.items ?? []).map((item) => printNullable(item, this.transform(item))).filter((item): item is string => Boolean(item)))
      // OpenAPI 3.1 `items` next to `prefixItems` types the elements after the positional ones.
      const rest = node.rest ? this.transform(node.rest) : null

      return pipe(rest ? `v.tupleWithRest(${items}, ${rest})` : `v.tuple(${items})`, [node.contains && containsCheck(this, node.contains)])
    },
    union(node) {
      const nodeMembers = node.members ?? []
      const { discriminatorPropertyName } = node
      // `v.variant` takes object schemas only. Intersections, wrapped objects, and `v.lazy` refs fall back to `v.union`.
      const isDiscriminated = !!discriminatorPropertyName && nodeMembers.every(isObjectNode)
      // `v.union` returns the first member that matches, and an object member drops the keys it does not
      // know. A strict member rejects those keys instead, so a `oneOf` value reaches the member it belongs to.
      const isXor = node.strategy === 'one' && !isDiscriminated && this.options.oneOfType === 'xor'
      // A union next to sibling properties in an `allOf` shares its value with them, so its members cannot be strict.
      const allOf = ast.schema.narrow(this.parent, ast.schema.types.intersection)
      const hasSiblingProperties =
        !!allOf?.members?.includes(node) && allOf.members.some((member) => member.type === ast.schema.types.object && member.properties.length > 0)
      const isStrict = node.strategy === 'one' && !isXor && !isDiscriminated && !hasSiblingProperties
      const members = nodeMembers
        .map((member) => {
          const output = this.transform(isStrict ? strictOneOfNode(member) : member)
          return printNullable(member, output && isStrict ? strictMember({ member: output, node: member, cyclicSchemas }) : output)
        })
        .filter((member): member is string => Boolean(member))

      if (members.length === 0) return ''
      if (members.length === 1) return members[0]!

      if (isDiscriminated) return `v.variant(${text.quote(discriminatorPropertyName)}, ${buildList(members)})`
      const union = `v.union(${buildList(members)})`
      // Valibot has no xor schema, so a check on the raw input counts the members that match.
      return isXor
        ? `((schema) => v.pipe(v.unknown(), v.check((value) => schema.options.filter((member) => v.is(member, value)).length === 1, "Value must match exactly one schema"), schema))(${union})`
        : union
    },
    intersection(node) {
      const members = node.members ?? []
      const [first, ...rest] = members
      if (!first) return ''
      const firstBase = this.transform(first)
      if (!firstBase) return ''

      // An object `allOf` is a merge: one `v.object` with the entries of every member stays usable in `v.variant` and `v.omit`.
      const base = ast.ref.mergeSchema(first)
      const baseObject = ast.schema.narrow(base, ast.schema.types.object)
      if (mergesToObject(node)) {
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
        // A `not` beside other keywords narrows the schema it sits on, so it checks that schema's value.
        if (member.type === ast.schema.types.not) {
          const check = notCheck(this, member)
          if (check) actions.push(check)
          continue
        }
        const constraints = memberActions({ member, base, regexType: this.options.regexType })
        const transformed = constraints.length ? null : this.transform(member)
        actions.push(...constraints)
        if (transformed) schemas.push(transformed)
      }

      return pipe(schemas.length > 1 ? `v.intersect(${buildList(schemas)})` : firstBase, actions)
    },
    not(node) {
      const check = notCheck(this, node)
      return check ? pipe(UNKNOWN, [check]) : null
    },
  }

  return {
    name: 'valibot',
    options,
    nodes: withInputChecks(nodes, (node) => node === uncheckedNode),
    overrides: options.nodes,
    print(node) {
      const transformed = this.transform(node)
      if (!transformed) return null

      const { keysToOmit, direction } = this.options
      const meta = ast.ref.mergeSchema(node)
      const canOmit = keysToOmit?.length && printsEntries(node)
      const value = canOmit ? omitKeys.call(this, { node, transformed, keysToOmit }) : transformed

      return applyModifiers({
        value,
        schema: node,
        nullable: meta.nullable,
        optional: meta.optional,
        nullish: meta.nullish,
        defaultValue: meta.default,
        title: hasMetadata(node) ? meta.title : undefined,
        description: hasMetadata(node) ? meta.description : undefined,
        examples: hasMetadata(node) ? meta.examples : undefined,
        direction,
      })
    },
  }
})
