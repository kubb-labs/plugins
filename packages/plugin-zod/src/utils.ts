import { buildObject, lazyGetter, objectKey, stringify, toRegExpString } from '@internals/utils'
import { mapSchemaProperties } from '@internals/shared'
import { ast, containsCircularRef, syncSchemaRef } from 'kubb/kit'
import type { PluginZod } from './types.ts'

/**
 * Returns `true` when the given coercion option enables coercion for the specified type.
 */
export function shouldCoerce(coercion: PluginZod['resolvedOptions']['coercion'] | undefined, type: 'dates' | 'strings' | 'numbers'): boolean {
  if (coercion === undefined || coercion === false) return false
  if (coercion === true) return true

  return !!coercion[type]
}

export function propertyNamesOf(node: ast.SchemaNode): ast.SchemaNode | undefined {
  return 'propertyNames' in node ? (node as { propertyNames?: ast.SchemaNode }).propertyNames : undefined
}

/**
 * Whether the schema node represents a closed or finite set of keys (e.g. enum, literal,
 * or union of enums/literals).
 *
 * In Zod v4, passing a closed key schema to `z.record()` enforces exhaustiveness (all keys
 * must exist in the input). OpenAPI 3.1 `propertyNames` only validates present keys without
 * requiring all keys to exist, so closed key schemas use `z.partialRecord()` instead.
 */
export function isClosedKeySchema(node: ast.SchemaNode | undefined): boolean {
  if (!node) return false
  const resolved = syncSchemaRef(node)
  if (resolved.type === 'enum') return true
  if (resolved.type === 'union') {
    const members = resolved.members ?? []
    return members.length > 0 && members.every(isClosedKeySchema)
  }
  return false
}

/**
 * Whether the node is a plain inline object whose shape can be lifted into an `.extend({ … })`
 * argument. A catchall, `patternProperties`, or a nullable/optional wrapper cannot, so those stay
 * on `.and(…)`.
 */
export function isPlainInlineObject(node: ast.SchemaNode): boolean {
  if (node.type !== 'object') return false
  if (node.nullable || node.optional || node.nullish) return false

  const hasAdditionalProperties = node.additionalProperties !== undefined
  const hasPatternProperties = Boolean(node.patternProperties)

  return !hasAdditionalProperties && !hasPatternProperties && !propertyNamesOf(node)
}

/**
 * Whether a node renders as a bare Zod object — one that accepts `.extend(…)` and can be a
 * `z.discriminatedUnion` option. Covers object nodes, `$ref`s that resolve to (or are still
 * unresolved) objects, single-member unions of an object, and object-composable `allOf`.
 *
 * `cyclicSchemas` bounds the recursion: a ref into a cycle renders as `z.lazy(…)`, not an object.
 */
export function isObjectSchemaNode(node: ast.SchemaNode, cyclicSchemas?: ReadonlySet<string>): boolean {
  if (node.nullable || node.optional || node.nullish) return false
  if (node.type === 'object') {
    const hasProperties = Boolean(node.properties?.length)
    const hasTypedAdditionalProperties = Boolean(node.additionalProperties && node.additionalProperties !== true)
    const hasPatternProperties = Boolean(node.patternProperties)

    const isRecord = !hasProperties && (hasTypedAdditionalProperties || hasPatternProperties || propertyNamesOf(node))

    return !isRecord
  }

  if (node.type === 'ref') {
    const refName = ast.resolveRefName(node)
    if (refName && cyclicSchemas?.has(refName)) return false
    const resolved = syncSchemaRef(node)
    // An unresolved ref keeps its `ref` type; assume it resolves to an object (matches the printer's
    // prior optimism that only a resolved intersection blocks a discriminated union).
    return resolved.type === 'ref' || isObjectSchemaNode(resolved, cyclicSchemas)
  }

  if (node.type === 'union') {
    const members = node.members ?? []
    return members.length === 1 && isObjectSchemaNode(members[0]!, cyclicSchemas)
  }

  return isObjectComposableIntersection(node, cyclicSchemas)
}

/**
 * Whether an `allOf` is a pure object composition — an object base plus inline object members whose
 * shapes merge with `.extend(…)`. These stay a Zod object instead of a `ZodIntersection`, which
 * `z.discriminatedUnion` rejects.
 */
export function isObjectComposableIntersection(node: ast.SchemaNode, cyclicSchemas?: ReadonlySet<string>): boolean {
  if (node.type !== 'intersection') return false
  const [first, ...rest] = node.members ?? []
  return !!first && isObjectSchemaNode(first, cyclicSchemas) && rest.every(isPlainInlineObject)
}

/**
 * Format a default value as a code-level literal.
 * Arrays and objects keep their contents as a JSON literal, primitives become their string
 * representation, strings are quoted.
 */
export function formatDefault(value: unknown): string {
  if (typeof value === 'string') return stringify(value)
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)

  return String(value ?? '')
}

/**
 * Format a default for `.default(...)` so the literal matches the generated schema's type.
 *
 * An OpenAPI `default` does not always agree with the schema it sits on: a `bigint` field
 * (`format: int64`) carries a `number` default, and a spec may put `default: {}` on an `array`.
 * Emitting those verbatim produces a Zod schema that does not typecheck, so coerce the bigint case
 * to a `BigInt(...)` literal and emit an array literal for arrays (dropping a non-array default).
 * Returns `null` when no `.default(...)` should be emitted. Keys off the schema node's type.
 */
export function defaultLiteral(node: ast.SchemaNode | undefined, value: unknown): string | null {
  // A `null` default is invalid on a non-nullable schema and redundant on a nullish one, and emitting
  // it produces a bare `.default()` (no argument). Drop it.
  if (value === null) return null
  const resolved = node ? syncSchemaRef(node) : undefined
  if (resolved && ast.narrowSchema(resolved, 'bigint')) {
    if (typeof value === 'bigint') return `BigInt(${value})`
    if (typeof value === 'number' && Number.isInteger(value)) return `BigInt(${value})`
    return null
  }
  if (resolved && ast.narrowSchema(resolved, 'array')) {
    return Array.isArray(value) ? JSON.stringify(value) : null
  }
  // An enum/literal schema narrows to its members (e.g. `1 | 3`), but the spec default may not match
  // that type (`default: '1'` on a numeric enum). Emit the matching member's typed literal so the
  // default agrees with the schema, or drop a default that matches no member.
  const enumNode = resolved ? ast.narrowSchema(resolved, 'enum') : undefined
  if (enumNode) {
    const values = enumNode.namedEnumValues?.map((member) => member.value) ?? enumNode.enumValues ?? []
    if (values.length) {
      const match = values.find((member) => member === value || String(member) === String(value))
      return match != null ? formatDefault(match) : null
    }
  }
  return formatDefault(value)
}

/**
 * Build the Zod schema for a set of literal enum values.
 * `z.enum()` only accepts string members in Zod v4, so a numeric, boolean, or
 * mixed set is emitted as a single `z.literal(…)` or a `z.union([z.literal(…), …])`.
 * An all-string set keeps the more compact `z.enum([…])`.
 */
export function buildEnum(values: Array<string | number | boolean>): string {
  const allStrings = values.every((v) => typeof v === 'string')
  if (allStrings) return `z.enum([${values.map((v) => formatDefault(v)).join(', ')}])`

  const literals = values.map((v) => `z.literal(${formatDefault(v)})`)
  if (literals.length === 1) return literals[0]!

  return `z.union([${literals.join(', ')}])`
}

/**
 * Numeric constraint limits for Zod schemas (min, max, and exclusive bounds).
 */
export type NumericConstraints = {
  min?: number
  max?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  multipleOf?: number
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
 * Digit pattern for a `type: 'string'` schema that carries an integer `format`, the way ProtoJSON
 * encodes 64-bit integers. Returns `undefined` for every other format, and a `pattern` from the
 * spec takes precedence over this fallback.
 *
 * @example
 * ```ts
 * integerFormatPattern('uint64') // '^\\d+$'
 * ```
 */
export function integerFormatPattern(format: string | undefined): string | undefined {
  if (format === 'int32' || format === 'int64') return '^-?\\d+$'
  if (format === 'uint64') return '^\\d+$'

  return undefined
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
export function numberConstraints({ min, max, exclusiveMinimum, exclusiveMaximum, multipleOf }: NumericConstraints): string {
  return [
    min !== undefined ? `.min(${min})` : '',
    max !== undefined ? `.max(${max})` : '',
    exclusiveMinimum !== undefined ? `.gt(${exclusiveMinimum})` : '',
    exclusiveMaximum !== undefined ? `.lt(${exclusiveMaximum})` : '',
    multipleOf !== undefined ? `.multipleOf(${multipleOf})` : '',
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
export function numberChecksMini({ min, max, exclusiveMinimum, exclusiveMaximum, multipleOf }: NumericConstraints): string {
  const checks: Array<string> = []
  if (min !== undefined) checks.push(`z.minimum(${min})`)
  if (max !== undefined) checks.push(`z.maximum(${max})`)
  if (exclusiveMinimum !== undefined) checks.push(`z.minimum(${exclusiveMinimum}, { exclusive: true })`)
  if (exclusiveMaximum !== undefined) checks.push(`z.maximum(${exclusiveMaximum}, { exclusive: true })`)
  if (multipleOf !== undefined) checks.push(`z.multipleOf(${multipleOf})`)
  return checks.length ? `.check(${checks.join(', ')})` : ''
}

/**
 * Build `.check(z.minLength(), z.maxLength(), z.regex())` for `zod/mini` length constraints.
 */
export function lengthChecksMini({ min, max, pattern, regexType }: LengthConstraints): string {
  const checks: Array<string> = []
  if (min !== undefined) checks.push(`z.minLength(${min})`)
  if (max !== undefined) checks.push(`z.maxLength(${max})`)
  if (pattern !== undefined) checks.push(`z.regex(${regexSource(pattern, regexType)})`)
  return checks.length ? `.check(${checks.join(', ')})` : ''
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
  const withDescription = description ? `${withDefault}.describe(${stringify(description)})` : withDefault
  return examples?.length ? `${withDescription}.meta({ examples: [${examples.map(formatDefault).join(', ')}] })` : withDescription
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
 * objects need no unwrap because the printer adds their modifiers after `.omit()`.
 */
export function omitUnwrapChain(node: ast.SchemaNode, step = '.unwrap()'): string {
  const ref = ast.narrowSchema(node, 'ref')
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
export const STRING_FORMAT_CALLS = new Map<string | undefined, string>([
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
 * Marks an inline `oneOf` object strict, so `object()` builds `z.strictObject(...)` and no eager `.shape` read hits a deferred getter.
 */
export function strictOneOfNode(node: ast.SchemaNode): ast.SchemaNode {
  return node.type === 'object' && node.additionalProperties === undefined ? { ...node, additionalProperties: false } : node
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
  numbers: (constraints: NumericConstraints) => string
}): string | undefined {
  if (member.primitive === 'string') return lengths({ ...(ast.narrowSchema(member, 'string') ?? {}), regexType }) || undefined
  if (member.primitive === 'number' || member.primitive === 'integer')
    return numbers(ast.narrowSchema(member, 'number') ?? ast.narrowSchema(member, 'integer') ?? {}) || undefined
  if (member.primitive === 'array') return lengths({ ...(ast.narrowSchema(member, 'array') ?? {}), regexType }) || undefined
}

type PrinterContext = {
  transform: (node: ast.SchemaNode) => string | null
  options: { cyclicSchemas?: ReadonlySet<string> }
}

/**
 * Builds the `{ key: value, … }` shape shared by the `z.object(...)` and `.extend(...)` renderings.
 */
export function buildObjectShape(
  ctx: PrinterContext,
  node: ast.SchemaNode,
  modify: (args: { value: string; schema: ast.SchemaNode; required?: boolean; meta: ReturnType<typeof syncSchemaRef> }) => string,
): string {
  const objectNode = ast.narrowSchema(node, 'object')
  if (!objectNode) return '{}'

  const isCyclic = (schema: ast.SchemaNode): boolean =>
    ctx.options.cyclicSchemas != null && containsCircularRef(schema, { circularSchemas: ctx.options.cyclicSchemas })

  const entries = mapSchemaProperties(objectNode, (schema) => {
    // A getter defers evaluation, so clear cyclicSchemas to skip z.lazy() on nested refs.
    const hasSelfRef = isCyclic(schema)
    const savedCyclicSchemas = ctx.options.cyclicSchemas
    if (hasSelfRef) ctx.options.cyclicSchemas = undefined
    const baseOutput = ctx.transform(schema) ?? ctx.transform(ast.factory.createSchema({ type: 'unknown' }))!
    if (hasSelfRef) ctx.options.cyclicSchemas = savedCyclicSchemas
    return baseOutput
  }).map(({ name: propName, property, output: baseOutput }) => {
    const { schema } = property
    const value = modify({ value: baseOutput, schema, required: property.required, meta: syncSchemaRef(schema) })

    return isCyclic(schema) ? lazyGetter({ name: propName, body: value }) : `${objectKey(propName)}: ${value}`
  })

  return buildObject(entries)
}

/**
 * Shared `print` body: transforms the node, applies `keysToOmit` as `.omit(...)` (or `z.omit(...)` when `mini`), then `modify` adds the modifiers.
 */
export function printWithOmit(
  ctx: { transform: (node: ast.SchemaNode) => string | null; options: { keysToOmit?: Array<string> | null } },
  node: ast.SchemaNode,
  modify: (value: string, meta: ReturnType<typeof syncSchemaRef>) => string,
  mini = false,
): string | null {
  const { keysToOmit } = ctx.options

  const transformed = ctx.transform(node)
  if (!transformed) return null

  const meta = syncSchemaRef(node)

  const base = (() => {
    if (!keysToOmit?.length || meta.primitive !== 'object' || (meta.type === 'union' && meta.discriminatorPropertyName)) return transformed

    // A ref resolves to a wrapper variable; unwrap to the inner object before omitting.
    // Zod Mini schemas have no `.unwrap()` / `.omit()`, so walk `_zod.def.innerType` and call `z.omit()`.
    const unwrap = omitUnwrapChain(node, mini ? '._zod.def.innerType' : '.unwrap()')
    const mask = `{ ${keysToOmit.map((k: string) => `"${k}": true`).join(', ')} }`
    const omit = (target: string) => (mini ? `z.omit(${target}${unwrap}, ${mask})` : `${target}${unwrap}.omit(${mask})`)

    const lazyMatch = transformed.match(/^z\.lazy\(\(\)\s*=>\s*(.+)\)$/)
    if (lazyMatch) return `z.lazy(() => ${omit(lazyMatch[1]!)})`
    return omit(transformed)
  })()

  return modify(base, meta)
}
