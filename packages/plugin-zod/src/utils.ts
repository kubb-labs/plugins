import { extractRefName, stringify, toRegExpString } from '@kubb/ast/utils'
import { ast } from '@kubb/core'
import { syncSchemaRef } from '@kubb/ast/utils'
import type { PluginZod } from './types.ts'

/**
 * Returns `true` when the given coercion option enables coercion for the specified type.
 */
export function shouldCoerce(coercion: PluginZod['resolvedOptions']['coercion'] | undefined, type: 'dates' | 'strings' | 'numbers'): boolean {
  if (coercion === undefined || coercion === false) return false
  if (coercion === true) return true

  return !!coercion[type]
}

/**
 * A codec for a schema node whose runtime type differs from its JSON wire type:
 * the output (response) schema decodes wire → runtime, and the input (request)
 * variant encodes runtime → wire.
 *
 * To support another codec type, append a `Codec` to `codecs` and route that
 * type's printer node handler through `getCodec`.
 */
export type Codec = {
  /**
   * Whether this node is encoded/decoded by this codec.
   */
  matches(node: ast.SchemaNode): boolean
  /**
   * Output direction (response): decode the wire value into the runtime type.
   */
  decode(node: ast.SchemaNode): string
  /**
   * Input direction (request): encode the runtime value back to the wire value.
   */
  encode(node: ast.SchemaNode): string
}

/**
 * `dateType: 'date'` fields are typed as `Date` but travel as ISO `string`s.
 * Output decodes `string → Date`; input encodes `Date → string`, preserving the
 * `date` (`YYYY-MM-DD`) vs `date-time` precision carried on `node.format`.
 */
const dateCodec: Codec = {
  matches(node) {
    return node.type === 'date' && node.representation === 'date'
  },
  decode(node) {
    return node.format === 'date' ? 'z.iso.date().transform((value) => new Date(value))' : 'z.iso.datetime().transform((value) => new Date(value))'
  },
  encode(node) {
    return node.format === 'date' ? 'z.date().transform((value) => value.toISOString().slice(0, 10))' : 'z.date().transform((value) => value.toISOString())'
  },
}

/**
 * Registered codecs, checked in order.
 */
const codecs: Array<Codec> = [dateCodec]

/**
 * Returns the codec for this node, or `undefined` when the node needs no
 * encode/decode (its wire and runtime types match).
 */
export function getCodec(node: ast.SchemaNode | undefined): Codec | undefined {
  if (!node) return undefined
  return codecs.find((codec) => codec.matches(node))
}

/**
 * Returns `true` when the node itself is encoded/decoded by a codec.
 */
export function hasCodec(node: ast.SchemaNode | undefined): boolean {
  return getCodec(node) !== undefined
}

/**
 * Returns `true` when the schema transitively contains a codec node —
 * a value whose runtime type differs from its wire type (see {@link hasCodec}),
 * so it must be decoded (response) or encoded (request) at the validation boundary.
 * `$ref`s are followed via their resolved schema; a `seen` set guards cycles.
 */
export function containsCodec(node: ast.SchemaNode | undefined, seen: Set<string> = new Set()): boolean {
  if (!node) return false

  if (hasCodec(node)) return true

  if (node.type === 'ref') {
    if (!node.ref) return false
    const refName = extractRefName(node.ref)
    if (refName) {
      if (seen.has(refName)) return false
      seen.add(refName)
    }
    const resolved = syncSchemaRef(node)
    if (resolved.type === 'ref') return false
    return containsCodec(resolved, seen)
  }

  const children: Array<ast.SchemaNode | undefined> = []
  if ('properties' in node && node.properties) children.push(...node.properties.map((prop) => prop.schema))
  if ('items' in node && node.items) children.push(...node.items)
  if ('members' in node && node.members) children.push(...node.members)
  if ('additionalProperties' in node && node.additionalProperties && node.additionalProperties !== true) children.push(node.additionalProperties)

  return children.some((child) => containsCodec(child, seen))
}

/**
 * Collects the names of `$ref` schemas that transitively contain a codec, so the generator can route
 * them to their input (encode) variant.
 */
export function collectCodecRefNames(node: ast.SchemaNode): Array<string> {
  return ast.collect<string>(node, {
    schema: (n) => (n.type === 'ref' && n.ref && containsCodec(n) ? (extractRefName(n.ref) ?? undefined) : undefined),
  })
}

/**
 * Format a default value as a code-level literal.
 * Objects become `{}`, primitives become their string representation, strings are quoted.
 */
export function formatDefault(value: unknown): string {
  if (typeof value === 'string') return stringify(value)
  if (typeof value === 'object' && value !== null) return '{}'

  return String(value ?? '')
}

/**
 * Format a primitive enum/literal value.
 * Strings are quoted; numbers and booleans are emitted raw.
 */
export function formatLiteral(v: string | number | boolean): string {
  if (typeof v === 'string') return stringify(v)

  return String(v)
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
 * Map a `regexType` to the `func` argument of `toRegExpString`: `'constructor'` emits
 * `new RegExp(...)`, while `'literal'` (the default) emits a regex literal.
 */
function regexFunc(regexType: PluginZod['resolvedOptions']['regexType'] | undefined): string | null {
  return regexType === 'constructor' ? 'RegExp' : null
}

/**
 * Builds a Zod record key schema that enforces the `patternProperties` regexes a plain
 * `.catchall()` would drop. Several patterns combine into one alternation (`(^a)|(^b)`).
 */
export function patternKeySchema({ patterns, regexType }: { patterns: Array<string>; regexType?: PluginZod['resolvedOptions']['regexType'] }): string {
  return `z.string().regex(${patternKeySource({ patterns, regexType })})`
}

/**
 * `zod/mini` variant of {@link patternKeySchema}, wrapping the regex in `.check(z.regex(...))`.
 */
export function patternKeySchemaMini({ patterns, regexType }: { patterns: Array<string>; regexType?: PluginZod['resolvedOptions']['regexType'] }): string {
  return `z.string().check(z.regex(${patternKeySource({ patterns, regexType })}))`
}

function patternKeySource({ patterns, regexType }: { patterns: Array<string>; regexType?: PluginZod['resolvedOptions']['regexType'] }): string {
  const source = patterns.length === 1 ? patterns[0]! : patterns.map((pattern) => `(${pattern})`).join('|')
  return toRegExpString(source, regexFunc(regexType))
}

/**
 * Modifier options for applying chainable methods to Zod schema values.
 */
export type ModifierOptions = {
  value: string
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
    pattern !== undefined ? `.regex(${toRegExpString(pattern, regexFunc(regexType))})` : '',
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
  if (pattern !== undefined) checks.push(`z.regex(${toRegExpString(pattern, regexFunc(regexType))})`)
  return checks.length ? `.check(${checks.join(', ')})` : ''
}

/**
 * Apply nullable / optional / nullish modifiers, an optional `.describe()` call, and an
 * optional `.meta({ examples })` call to a schema value string using the chainable Zod v4 API.
 */
export function applyModifiers({ value, nullable, optional, nullish, defaultValue, description, examples }: ModifierOptions): string {
  const withModifier = (() => {
    if (nullish || (nullable && optional)) return `${value}.nullish()`
    if (optional) return `${value}.optional()`
    if (nullable) return `${value}.nullable()`
    return value
  })()
  const withDefault = defaultValue !== undefined ? `${withModifier}.default(${formatDefault(defaultValue)})` : withModifier
  const withDescription = description ? `${withDefault}.describe(${stringify(description)})` : withDefault
  return examples?.length ? `${withDescription}.meta({ examples: [${examples.map(formatDefault).join(', ')}] })` : withDescription
}

/**
 * Apply nullable / optional / nullish modifiers using the functional `zod/mini` API
 * (`z.nullable()`, `z.optional()`, `z.nullish()`).
 */
export function applyMiniModifiers({ value, nullable, optional, nullish, defaultValue }: Omit<ModifierOptions, 'description'>): string {
  const withModifier = (() => {
    if (nullish) return `z.nullish(${value})`
    const withNullable = nullable ? `z.nullable(${value})` : value
    return optional ? `z.optional(${withNullable})` : withNullable
  })()
  return defaultValue !== undefined ? `z._default(${withModifier}, ${formatDefault(defaultValue)})` : withModifier
}

type BuildGroupedParamsSchemaOptions = {
  params: Array<ast.ParameterNode>
  optional?: boolean
}

/**
 * Builds an `object` schema node grouping the given parameter nodes.
 * The `primitive: 'object'` marker ensures the Zod printer emits `z.object(…)` rather than a record.
 */
export function buildGroupedParamsSchema({ params, optional }: BuildGroupedParamsSchemaOptions): ast.SchemaNode {
  return ast.factory.createSchema({
    type: 'object',
    optional,
    primitive: 'object',
    properties: params.map((param) =>
      ast.factory.createProperty({
        name: param.name,
        required: param.required,
        schema: param.schema,
      }),
    ),
  })
}
