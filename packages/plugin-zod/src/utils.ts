import { ast } from '@internals/ast'
import { type NumericBounds, defaultLiteral, formatDefault, hasInputChecks, numericLiteral } from '@internals/shared'
import { buildObject, toRegExpString } from '@internals/utils'
import { text } from '@kubb/kit'
import type { PluginZod } from './types.ts'

/**
 * Build the Zod schema for a set of literal enum values.
 * `z.enum()` only accepts string members in Zod v4, so a numeric, boolean, or
 * mixed set is emitted as a single `z.literal(…)` or a `z.union([z.literal(…), …])`.
 * An all-string set keeps the more compact `z.enum([…])`.
 */
export function buildEnum(values: Array<unknown>): string {
  const allStrings = values.every((v) => typeof v === 'string')
  if (allStrings) return `z.enum([${values.map((v) => formatDefault(v)).join(', ')}])`

  const literals = values.map((value) => buildLiteral(value))
  if (literals.length === 1) return literals[0]!

  return `z.union([${literals.join(', ')}])`
}

/**
 * Preserves the structure of JSON const values in both Zod APIs.
 */
export function buildLiteral(value: unknown): string {
  if (value === null) return 'z.null()'
  if (Array.isArray(value)) return `z.tuple([${value.map((item) => buildLiteral(item)).join(', ')}])`
  if (typeof value === 'object') {
    const properties = Object.entries(value).map(([name, item]) => `${JSON.stringify(name)}: ${buildLiteral(item)}`)
    return `z.strictObject({${properties.join(', ')}})`
  }
  return `z.literal(${formatDefault(value)})`
}

/**
 * Length constraint limits for string and array schemas (min, max, and regex pattern).
 */
export type LengthConstraints = {
  min?: number
  max?: number
  pattern?: string
  /**
   * Output form for the `pattern` regex. `'literal'` emits a regex literal,
   * `'constructor'` emits `new RegExp(...)`.
   *
   * @default 'literal'
   */
  regexType?: PluginZod['resolvedOptions']['regexType']
}

/**
 * Renders a `pattern` as a regex literal, or as `new RegExp(...)` when `regexType` is `'constructor'`.
 */
function regexSource(pattern: string, regexType: PluginZod['resolvedOptions']['regexType'] | undefined): string {
  return toRegExpString(pattern, regexType === 'constructor' ? 'RegExp' : null)
}

function joinPatterns(patterns: Array<string>): string {
  return patterns.length === 1 ? patterns[0]! : patterns.map((pattern) => `(${pattern})`).join('|')
}

/**
 * Builds a Zod record key schema that enforces the `patternProperties` regexes a plain
 * `.catchall()` would drop.
 */
export function patternKeySchema({ patterns, regexType }: { patterns: Array<string>; regexType?: PluginZod['resolvedOptions']['regexType'] }): string {
  return `z.string().regex(${regexSource(joinPatterns(patterns), regexType)})`
}

/**
 * `zod/mini` variant of {@link patternKeySchema}, wrapping the regex in `.check(z.regex(...))`.
 */
export function patternKeySchemaMini({ patterns, regexType }: { patterns: Array<string>; regexType?: PluginZod['resolvedOptions']['regexType'] }): string {
  return `z.string().check(z.regex(${regexSource(joinPatterns(patterns), regexType)}))`
}

/**
 * Modifier options for applying chainable methods to Zod schema values.
 */
export type ModifierOptions = {
  value: string
  schema?: ast.SchemaNode
  nullable?: boolean
  optional?: boolean
  nullish?: boolean
  defaultValue?: unknown
  description?: string
  examples?: Array<unknown>
}

/**
 * Build `.min()` / `.max()` / `.gt()` / `.lt()` constraint chains for numbers
 * using the standard chainable Zod v4 API.
 */
export function numberConstraints({ min, max, exclusive, multipleOf }: NumericBounds, isBigint = false): string {
  const literal = (value: number | string) => numericLiteral(value, isBigint)

  return [
    min !== undefined ? `.min(${literal(min)})` : '',
    max !== undefined ? `.max(${literal(max)})` : '',
    exclusive?.min !== undefined ? `.gt(${literal(exclusive.min)})` : '',
    exclusive?.max !== undefined ? `.lt(${literal(exclusive.max)})` : '',
    multipleOf !== undefined ? `.multipleOf(${literal(multipleOf)})` : '',
  ].join('')
}

/**
 * Build `.min()` / `.max()` / `.regex()` chains for strings/arrays
 * using the standard chainable Zod v4 API.
 */
export function lengthConstraints({ min, max, pattern, regexType }: LengthConstraints): string {
  return [
    min !== undefined ? `.min(${min})` : '',
    max !== undefined ? `.max(${max})` : '',
    pattern !== undefined ? `.regex(${regexSource(pattern, regexType)})` : '',
  ].join('')
}

/**
 * Build `.check(z.minimum(), z.maximum())` for `zod/mini` numeric constraints.
 */
export function numberChecksMini({ min, max, exclusive, multipleOf }: NumericBounds, isBigint = false): string {
  const literal = (value: number | string) => numericLiteral(value, isBigint)
  const checks = [
    min !== undefined && `z.minimum(${literal(min)})`,
    max !== undefined && `z.maximum(${literal(max)})`,
    exclusive?.min !== undefined && `z.gt(${literal(exclusive.min)})`,
    exclusive?.max !== undefined && `z.lt(${literal(exclusive.max)})`,
    multipleOf !== undefined && `z.multipleOf(${literal(multipleOf)})`,
  ].filter(Boolean)
  return checks.length ? `.check(${checks.join(', ')})` : ''
}

/**
 * Build `.check(z.minLength(), z.maxLength(), z.regex())` for `zod/mini` length constraints.
 */
export function lengthChecksMini({ min, max, pattern, regexType }: LengthConstraints): string {
  const checks = [
    min !== undefined && `z.minLength(${min})`,
    max !== undefined && `z.maxLength(${max})`,
    pattern !== undefined && `z.regex(${regexSource(pattern, regexType)})`,
  ].filter(Boolean)
  return checks.length ? `.check(${checks.join(', ')})` : ''
}

/**
 * Checks the raw input, before parsing strips unknown keys or inserts defaults: property counts, key names, then the
 * printed `conditionals`.
 */
export function inputChecks({
  value,
  node,
  keySchema,
  conditionals,
}: {
  value: string
  node: ast.SchemaNode
  keySchema?: string | null
  conditionals: Array<string>
}): string {
  const skip = 'typeof value !== "object" || value === null || Array.isArray(value)'
  const { min, max } = node.type === 'object' ? node : {}
  const checks = [
    min !== undefined && `z.refine(value => ${skip} || Object.keys(value).length >= ${min}, { message: "Object must have at least ${min} properties" })`,
    max !== undefined && `z.refine(value => ${skip} || Object.keys(value).length <= ${max}, { message: "Object must have at most ${max} properties" })`,
    keySchema &&
      `z.refine(value => ${skip} || Object.keys(value).every((key) => ${keySchema}.safeParse(key).success), { message: "Object keys must match the property names schema" })`,
    ...conditionals,
  ].filter(Boolean)
  return checks.length ? `z.pipe(z.unknown().check(${checks.join(', ')}), ${value})` : value
}

/**
 * Apply nullable / optional / nullish modifiers, an optional `.describe()` call, and an
 * optional `.meta({ examples })` call to a schema value string using the chainable Zod v4 API.
 */
export function applyModifiers({ value, schema, nullable, optional, nullish, defaultValue, description, examples }: ModifierOptions): string {
  const withModifier = (() => {
    if (nullish || (nullable && optional)) return `${value}.nullish()`
    if (optional) return `${value}.optional()`
    if (nullable) return `${value}.nullable()`
    return value
  })()
  const literal = defaultValue !== undefined ? defaultLiteral(schema, defaultValue) : null
  const withDefault = literal !== null ? `${withModifier}.default(${literal})` : withModifier
  const withDescription = description ? `${withDefault}.describe(${text.quote(description)})` : withDefault
  return examples?.length
    ? `${withDescription}.meta({ examples: [${examples.map((example) => (example === null ? 'null' : formatDefault(example))).join(', ')}] })`
    : withDescription
}

function modifierDepth(schema: ast.SchemaNode): number {
  if (schema.nullish || (schema.nullable && schema.optional)) return 2
  if (schema.nullable || schema.optional) return 1
  return 0
}

/**
 * Build the `.unwrap()` chain to insert before `.omit()` when the schema is a `$ref`.
 *
 * A `$ref` resolves to a named schema variable that already carries its own `.nullable()` /
 * `.optional()` / `.nullish()` / `.default()` wrappers. `.omit()` lives on the inner `ZodObject`,
 * not on those `ZodNullable` / `ZodOptional` / `ZodDefault` wrappers, so the omit has to unwrap
 * down to the object first. This mirrors plugin-ts emitting `Omit<NonNullable<T>, …>`. Inline
 * objects need no unwrap because the printer adds their modifiers after `.omit()`. Zod Mini has no
 * `.unwrap()`, so its printer passes `._zod.def.innerType` as the `step`.
 */
export function omitUnwrapChain(node: ast.SchemaNode, step = '.unwrap()'): string {
  const ref = ast.schema.narrow(node, 'ref')
  if (!ref) return ''

  const target = ref.schema ?? ref
  const depth = modifierDepth(target) + (target.default !== undefined ? 1 : 0)
  return step.repeat(depth)
}

/**
 * Apply nullable / optional / nullish modifiers using the functional `zod/mini` API
 * (`z.nullable()`, `z.optional()`, `z.nullish()`).
 */
export function applyMiniModifiers({ value, schema, nullable, optional, nullish, defaultValue }: Omit<ModifierOptions, 'description'>): string {
  const withModifier = (() => {
    if (nullish) return `z.nullish(${value})`
    const withNullable = nullable ? `z.nullable(${value})` : value
    return optional ? `z.optional(${withNullable})` : withNullable
  })()
  const literal = defaultValue !== undefined ? defaultLiteral(schema, defaultValue) : null
  return literal !== null ? `z._default(${withModifier}, ${literal})` : withModifier
}

/**
 * Calls for string `format`s with a dedicated Zod constructor; a `Map` so `constructor` cannot hit `Object.prototype`.
 */
export const stringFormatCalls = new Map<string | undefined, string>([
  ['byte', 'z.base64()'],
  ['base64', 'z.base64()'],
  ['base64url', 'z.base64url()'],
  ['jwt', 'z.jwt()'],
  ['ulid', 'z.ulid()'],
  ['iban', 'z.iban()'],
  ['duration', 'z.iso.duration()'],
  ['hostname', 'z.hostname()'],
])

/**
 * Calls for a string's `contentEncoding` with a dedicated Zod constructor.
 */
export const contentEncodingCalls = new Map<string | undefined, string>([
  ['base64', 'z.base64()'],
  ['base64url', 'z.base64url()'],
])

/**
 * The check for a string that holds a JSON document: it must parse, and the parsed value must pass `schema`.
 */
export function jsonContentCheck(schema: string): string {
  return `(value) => { try { return ${schema}.safeParse(JSON.parse(value)).success } catch { return false } }, { message: "String must hold JSON that matches its content schema" }`
}

/**
 * The constraint chain an `allOf` member adds to a bare string, number or array; each printer passes its own renderers.
 */
export function getMemberConstraint({
  member,
  regexType,
  lengths,
  numbers,
}: {
  member: ast.SchemaNode
  regexType?: LengthConstraints['regexType']
  lengths: (constraints: LengthConstraints) => string
  numbers: (constraints: NumericBounds) => string
}): string | undefined {
  // Checks a suffix cannot carry stay on the member's own schema.
  if (hasInputChecks(member) || ast.schema.narrow(member, 'array')?.contains) return undefined
  if (member.primitive === 'string') return lengths({ ...(ast.schema.narrow(member, 'string') ?? {}), regexType }) || undefined
  if (member.primitive === 'number' || member.primitive === 'integer')
    return numbers(ast.schema.narrow(member, 'number') ?? ast.schema.narrow(member, 'integer') ?? {}) || undefined
  if (member.primitive === 'array') return lengths({ ...(ast.schema.narrow(member, 'array') ?? {}), regexType }) || undefined
}

export type PrinterContext = {
  transform: (node: ast.SchemaNode) => string | null
  options: { cyclicSchemas?: ReadonlySet<string>; nodes?: Partial<Record<ast.SchemaType, unknown>> }
}

/**
 * Builds the `{ key: value, … }` shape shared by the `z.object(...)` and `.extend(...)` renderings.
 */
export function buildObjectShape(
  ctx: PrinterContext,
  node: ast.SchemaNode,
  renderProperty: (args: {
    name: string
    value: string
    schema: ast.SchemaNode
    required?: boolean
    meta: ReturnType<typeof ast.ref.mergeSchema>
    cyclic: boolean
  }) => string,
): string {
  const objectNode = ast.schema.narrow(node, 'object')
  if (!objectNode) return '{}'

  const isCyclic = (schema: ast.SchemaNode): boolean =>
    ctx.options.cyclicSchemas != null && ast.graph.containsCircular(schema, { circularSchemas: ctx.options.cyclicSchemas })

  const transformed = objectNode.properties.map(({ schema }) => {
    // A getter defers evaluation, so clear cyclicSchemas to skip z.lazy() on nested refs.
    const hasSelfRef = isCyclic(schema)
    const savedCyclicSchemas = ctx.options.cyclicSchemas
    if (hasSelfRef) ctx.options.cyclicSchemas = undefined
    const baseOutput = ctx.transform(schema) ?? ctx.transform(ast.factory.createSchema({ type: 'unknown' }))!
    if (hasSelfRef) ctx.options.cyclicSchemas = savedCyclicSchemas
    return baseOutput
  })
  const entries = objectNode.properties.map((property, index) => {
    const { name, schema } = property
    const value = transformed[index]!
    return renderProperty({ name, value, schema, required: property.required, meta: ast.ref.mergeSchema(schema), cyclic: isCyclic(schema) })
  })

  return buildObject(entries)
}

/**
 * Shared `print` body: transforms the node, applies `keysToOmit` as `.omit(...)` (or `z.omit(...)` when `mini`), then `modify` adds the modifiers.
 */
export function printWithOmit(
  ctx: { transform: (node: ast.SchemaNode) => string | null; options: { keysToOmit?: Array<string> | null } },
  node: ast.SchemaNode,
  modify: (value: string, meta: ReturnType<typeof ast.ref.mergeSchema>) => string,
  mini = false,
): string | null {
  const { keysToOmit } = ctx.options

  const transformed = ctx.transform(node)
  if (!transformed) return null

  const meta = ast.ref.mergeSchema(node)

  const base = (() => {
    if (!keysToOmit?.length || meta.primitive !== 'object' || (meta.type === 'union' && meta.discriminatorPropertyName)) return transformed

    // A ref resolves to a wrapper variable; unwrap to the inner object before omitting.
    // Zod Mini schemas have no `.unwrap()` / `.omit()`, so walk `_zod.def.innerType` and call `z.omit()`.
    const unwrap = omitUnwrapChain(node, mini ? '._zod.def.innerType' : '.unwrap()')
    const mask = `{ ${keysToOmit.map((k: string) => `"${k}": true`).join(', ')} }`
    const omit = (target: string) => {
      const inner = `${target}${unwrap}`
      const hasObjectConstraints = hasInputChecks(meta)
      const pipe = mini ? `${inner}._zod.def` : inner
      const object = hasObjectConstraints ? `${pipe}.out` : inner
      const omitted = mini ? `z.omit(${object}, ${mask})` : `${object}.omit(${mask})`
      return hasObjectConstraints ? `z.pipe(${pipe}.in, ${omitted})` : omitted
    }

    const lazyMatch = transformed.match(/^z\.lazy\(\(\)\s*=>\s*(.+)\)$/)
    if (lazyMatch) return `z.lazy(() => ${omit(lazyMatch[1]!)})`
    return omit(transformed)
  })()

  return modify(base, meta)
}

/**
 * The helper an inferred alias is printed with. `'codec'` reads a request (encode) schema from its
 * input and a response (decode) schema from its output; `true` keeps `z.infer` for both.
 */
export function aliasKind(inferred: PluginZod['resolvedOptions']['inferred'], direction: 'encode' | 'decode'): 'infer' | 'input' | 'output' {
  if (inferred !== 'codec') return 'infer'
  return direction === 'encode' ? 'input' : 'output'
}
