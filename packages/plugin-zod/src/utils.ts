import { stringify, toRegExpString } from '@internals/utils'
import { ast } from '@kubb/core'
import { isRoundTripNode } from './roundTrip.ts'
import type { PluginZod, ResolverZod } from './types.ts'

/**
 * Returns `true` when the given coercion option enables coercion for the specified type.
 */
export function shouldCoerce(coercion: PluginZod['resolvedOptions']['coercion'] | undefined, type: 'dates' | 'strings' | 'numbers'): boolean {
  if (coercion === undefined || coercion === false) return false
  if (coercion === true) return true

  return !!coercion[type]
}

/**
 * Returns `true` when the schema transitively contains a round-trip boundary —
 * a node whose runtime type differs from its wire type (see {@link isRoundTripNode}),
 * so it must be decoded (response) or encoded (request) at the validation boundary.
 * `$ref`s are followed via their resolved schema; a `seen` set guards cycles.
 */
export function containsRoundTripNode(node: ast.SchemaNode | undefined, seen: Set<string> = new Set()): boolean {
  if (!node) return false

  if (isRoundTripNode(node)) return true

  if (node.type === 'ref') {
    if (!node.ref) return false
    const refName = ast.extractRefName(node.ref)
    if (refName) {
      if (seen.has(refName)) return false
      seen.add(refName)
    }
    const resolved = ast.syncSchemaRef(node)
    if (resolved.type === 'ref') return false
    return containsRoundTripNode(resolved, seen)
  }

  const children: Array<ast.SchemaNode | undefined> = []
  if ('properties' in node && node.properties) children.push(...node.properties.map((prop) => prop.schema))
  if ('items' in node && node.items) children.push(...node.items)
  if ('members' in node && node.members) children.push(...node.members)
  if ('additionalProperties' in node && node.additionalProperties && node.additionalProperties !== true) children.push(node.additionalProperties)

  return children.some((child) => containsRoundTripNode(child, seen))
}

/**
 * Collects all resolved schema names for an operation's parameters and responses
 * into a single lookup object, useful for building imports and type references.
 */
export function buildSchemaNames(node: ast.OperationNode, { params, resolver }: { params: Array<ast.ParameterNode>; resolver: ResolverZod }) {
  const pathParam = params.find((p) => p.in === 'path')
  const queryParam = params.find((p) => p.in === 'query')
  const headerParam = params.find((p) => p.in === 'header')

  const responses: Record<number | string, string> = {}
  const errors: Record<number | string, string> = {}

  for (const res of node.responses) {
    const name = resolver.resolveResponseStatusName(node, res.statusCode)
    const statusNum = Number(res.statusCode)

    if (!Number.isNaN(statusNum)) {
      responses[statusNum] = name
      if (statusNum >= 400) {
        errors[statusNum] = name
      }
    }
  }

  responses['default'] = resolver.resolveResponseName(node)

  return {
    request: node.requestBody?.content?.[0]?.schema ? resolver.resolveDataName(node) : null,
    parameters: {
      path: pathParam ? resolver.resolvePathParamsName(node, pathParam) : null,
      query: queryParam ? resolver.resolveQueryParamsName(node, queryParam) : null,
      header: headerParam ? resolver.resolveHeaderParamsName(node, headerParam) : null,
    },
    responses,
    errors,
  }
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
export function lengthConstraints({ min, max, pattern }: LengthConstraints): string {
  return [
    min !== undefined ? `.min(${min})` : '',
    max !== undefined ? `.max(${max})` : '',
    pattern !== undefined ? `.regex(${toRegExpString(pattern, null)})` : '',
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
export function lengthChecksMini({ min, max, pattern }: LengthConstraints): string {
  const checks: Array<string> = []
  if (min !== undefined) checks.push(`z.minLength(${min})`)
  if (max !== undefined) checks.push(`z.maxLength(${max})`)
  if (pattern !== undefined) checks.push(`z.regex(${toRegExpString(pattern, null)})`)
  return checks.length ? `.check(${checks.join(', ')})` : ''
}

/**
 * Apply nullable / optional / nullish modifiers and an optional `.describe()` call
 * to a schema value string using the chainable Zod v4 API.
 */
export function applyModifiers({ value, nullable, optional, nullish, defaultValue, description }: ModifierOptions): string {
  const withModifier = (() => {
    if (nullish || (nullable && optional)) return `${value}.nullish()`
    if (optional) return `${value}.optional()`
    if (nullable) return `${value}.nullable()`
    return value
  })()
  const withDefault = defaultValue !== undefined ? `${withModifier}.default(${formatDefault(defaultValue)})` : withModifier
  return description ? `${withDefault}.describe(${stringify(description)})` : withDefault
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
  return ast.createSchema({
    type: 'object',
    optional,
    primitive: 'object',
    properties: params.map((param) =>
      ast.createProperty({
        name: param.name,
        required: param.required,
        schema: param.schema,
      }),
    ),
  })
}
