import { ast } from '@internals/ast'
import { defaultLiteral, formatDefault, getChecks, type NumericBounds, numericLiteral } from '@internals/shared'
import { objectKey, toRegExpString } from '@internals/utils'
import { text } from '@kubb/kit'
import type { PrinterValibotNodes, PrinterValibotOptions } from './printers/printerValibot.ts'

export type LengthConstraints = { min?: number; max?: number; pattern?: string }

export type ValibotPrinterContext = { transform: (node: ast.SchemaNode) => string | null; options: PrinterValibotOptions }

export type ApplyModifiersOptions = {
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

export const UNKNOWN = 'v.unknown()'

// A check on the raw input skips every value that is not a plain object.
const NOT_OBJECT = 'typeof value !== "object" || value === null || Array.isArray(value)'

// Actions for string `format`s that Valibot checks with a dedicated action.
export const stringFormatActions = new Map<string | undefined, string>([
  ['byte', 'v.base64()'],
  ['base64', 'v.base64()'],
  ['ulid', 'v.ulid()'],
])

export function pipe(base: string, actions: Array<string | false | null | undefined>): string {
  const list = actions.filter(Boolean)

  return list.length ? `v.pipe(${[base, ...list].join(', ')})` : base
}

export function notCheck(ctx: { transform: (node: ast.SchemaNode) => string | null | undefined }, node: ast.SchemaNode): string | null {
  const [member] = ast.schema.narrow(node, ast.schema.types.not)?.members ?? []
  const schema = member ? ctx.transform(member) : null
  return schema ? `v.check((value) => !v.is(${schema}, value), "Value must not match the schema")` : null
}

export function lengthActions({ min, max, pattern }: LengthConstraints, regexType: PrinterValibotOptions['regexType']): Array<string> {
  return [
    min !== undefined && `v.minLength(${min})`,
    max !== undefined && `v.maxLength(${max})`,
    pattern !== undefined && `v.regex(${toRegExpString(pattern, regexType === 'constructor' ? 'RegExp' : null)})`,
  ].filter((action): action is string => Boolean(action))
}

export function numberActions({ min, max, exclusive, multipleOf }: NumericBounds, isBigint = false): Array<string> {
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
export function memberActions({
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
export function buildEnum(values: Array<unknown>): string {
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

export const hasChecks = (node: ast.SchemaNode) => getChecks(node).length > 0

// Wraps a value in `v.nullable(...)` and `v.optional(...)`. A default goes in as the second argument
// of `v.optional`, so `null` stays `null` and only a missing value takes the default.
export function applyModifiers({
  value,
  schema,
  nullable,
  optional,
  nullish,
  defaultValue,
  title,
  description,
  examples,
  direction,
}: ApplyModifiersOptions): string {
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
export function hasMetadata(node: ast.SchemaNode): boolean {
  return node.type !== ast.schema.types.ref && Boolean(node.title || node.description || node.examples?.length)
}

// The `.wrapped` chain that reaches the object behind the `v.optional` and `v.nullable` wrappers
// `applyModifiers` puts on the const a `$ref` resolves to.
export function unwrapChain(node: ast.SchemaNode, direction: PrinterValibotOptions['direction']): string {
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

export function objectEntries(ctx: ValibotPrinterContext, properties: Array<ast.PropertyNode>): Array<string> {
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
export function strictMember({ member, node, cyclicSchemas }: { member: string; node: ast.SchemaNode; cyclicSchemas?: ReadonlySet<string> }): string {
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

export function containsCheck(ctx: ValibotPrinterContext, { schema, min = 1, max }: NonNullable<ast.ArraySchemaNode['contains']>): string | false {
  if (min === 0 && max === undefined) return false
  const bounds = [`count >= ${min}`, max !== undefined && `count <= ${max}`].filter(Boolean).join(' && ')
  const message = max !== undefined ? `Array must contain ${min} to ${max} matching items` : `Array must contain at least ${min} matching items`

  return `v.check((items) => { const count = items.filter((item) => v.is(${ctx.transform(schema) ?? UNKNOWN}, item)).length; return ${bounds} }, ${JSON.stringify(message)})`
}

// A required `unknown` property means "the key is present", which an object schema accepts as missing, so those keys are checked with `in`.
function conditionExpression(ctx: ValibotPrinterContext, schema: ast.SchemaNode | undefined): string {
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
export function inputChecks(ctx: ValibotPrinterContext, node: ast.SchemaNode): Array<string> {
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
export function withInputChecks(nodes: PrinterValibotNodes, isSkipped: (node: ast.SchemaNode) => boolean): PrinterValibotNodes {
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
