import { stringify, toRegExpString } from '@internals/utils'
import type { ast } from '@kubb/core'
import type { PluginValibot } from './types.ts'
import type { ResolverValibot } from './types.ts'

export function buildSchemaNames(node: ast.OperationNode, { params, resolver }: { params: Array<ast.ParameterNode>; resolver: ResolverValibot }) {
  const pathParam = params.find((p) => p.in === 'path')
  const queryParam = params.find((p) => p.in === 'query')
  const headerParam = params.find((p) => p.in === 'header')

  const responses: Record<number | string, string> = {}
  const errors: Record<number | string, string> = {}

  for (const res of node.responses) {
    if (!res.schema) continue

    const name = resolver.resolveResponseStatusName(node, res.statusCode)
    const statusNum = Number(res.statusCode)

    if (!Number.isNaN(statusNum)) {
      responses[statusNum] = name
      if (statusNum >= 400) {
        errors[statusNum] = name
      }
    }
  }

  if (node.responses.some((res) => res.schema)) {
    responses.default = resolver.resolveResponseName(node)
  }

  return {
    request: node.requestBody?.content?.[0]?.schema ? resolver.resolveDataName(node) : undefined,
    parameters: {
      path: pathParam ? resolver.resolvePathParamsName(node, pathParam) : undefined,
      query: queryParam ? resolver.resolveQueryParamsName(node, queryParam) : undefined,
      header: headerParam ? resolver.resolveHeaderParamsName(node, headerParam) : undefined,
    },
    responses,
    errors,
  }
}

export function formatDefault(value: unknown): string {
  if (typeof value === 'string') return stringify(value)
  if (value === undefined) return ''

  return formatCodeLiteral(value)
}

export function formatLiteral(v: string | number | boolean): string {
  if (typeof v === 'string') return stringify(v)

  return String(v)
}

export type NumericConstraints = {
  min?: number
  max?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  multipleOf?: number
}

export type LengthConstraints = {
  min?: number
  max?: number
  pattern?: string
}

export type ModifierOptions = {
  value: string
  nullable?: boolean
  optional?: boolean
  nullish?: boolean
  defaultValue?: unknown
  optionalType?: PluginValibot['resolvedOptions']['optionalType']
  defaultMode?: PluginValibot['resolvedOptions']['defaultMode']
  actions?: Array<string | undefined>
}

type SchemaMetadataOptions = NonNullable<PluginValibot['resolvedOptions']['metadata']>

type SchemaLike = ast.SchemaNode & Record<string, unknown>

export function pipe(value: string, actions: Array<string | undefined>): string {
  const filtered = actions.filter((action): action is string => Boolean(action))
  if (!filtered.length) return value

  return `v.pipe(${value}, ${filtered.join(', ')})`
}

export function numberActions({ min, max, exclusiveMinimum, exclusiveMaximum, multipleOf }: NumericConstraints): Array<string | undefined> {
  return [
    min !== undefined ? `v.minValue(${min})` : undefined,
    max !== undefined ? `v.maxValue(${max})` : undefined,
    exclusiveMinimum !== undefined ? `v.gtValue(${exclusiveMinimum})` : undefined,
    exclusiveMaximum !== undefined ? `v.ltValue(${exclusiveMaximum})` : undefined,
    multipleOf !== undefined ? `v.multipleOf(${multipleOf})` : undefined,
  ]
}

export function lengthActions({ min, max, pattern }: LengthConstraints): Array<string | undefined> {
  return [
    min !== undefined ? `v.minLength(${min})` : undefined,
    max !== undefined ? `v.maxLength(${max})` : undefined,
    pattern !== undefined ? `v.regex(${toRegExpString(pattern, null)})` : undefined,
  ]
}

export function formatCodeLiteral(value: unknown): string {
  if (typeof value === 'string') return stringify(value)
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return String(value)

  return JSON.stringify(value)
}

export function schemaActions(schema: ast.SchemaNode, options: { metadata?: SchemaMetadataOptions; readonly?: boolean }): Array<string | undefined> {
  const schemaLike = schema as SchemaLike
  const metadata = options.metadata
  const metadataOptions = metadata === true ? { title: true, description: true, examples: true, extensions: true } : metadata || {}

  const examples = schemaLike.examples ?? (schemaLike.example !== undefined ? [schemaLike.example] : undefined)
  const extensions = Object.fromEntries(Object.entries(schemaLike).filter(([key]) => key.startsWith('x-')))

  return [
    // Valibot-only metadata actions keep OpenAPI annotations attached to the schema.
    metadataOptions.title && typeof schemaLike.title === 'string' && schemaLike.title ? `v.title(${stringify(schemaLike.title)})` : undefined,
    metadataOptions.description && typeof schemaLike.description === 'string' && schemaLike.description ? `v.description(${stringify(schemaLike.description)})` : undefined,
    metadataOptions.examples && Array.isArray(examples) && examples.length ? `v.examples(${formatCodeLiteral(examples)})` : undefined,
    metadataOptions.extensions && Object.keys(extensions).length ? `v.metadata(${formatCodeLiteral(extensions)})` : undefined,
    options.readonly && schemaLike.readOnly === true ? 'v.readonly()' : undefined,
  ]
}

export function applyModifiers({ value, nullable, optional, nullish, defaultValue, optionalType = 'optional', defaultMode = 'default', actions = [] }: ModifierOptions): string {
  let result = value
  if (nullish || (nullable && optional)) {
    result = `v.nullish(${result})`
  } else if (optional) {
    // Valibot can express optional object entries in three distinct ways.
    let optionalFn: string
    if (optionalType === 'exactOptional') {
      optionalFn = 'exactOptional'
    } else if (optionalType === 'undefinedable') {
      optionalFn = 'undefinedable'
    } else {
      optionalFn = 'optional'
    }
    result = defaultValue !== undefined ? `v.${optionalFn}(${result}, ${formatDefault(defaultValue)})` : `v.${optionalFn}(${result})`
  } else if (nullable) {
    result = `v.nullable(${result})`
  }

  // `fallback` is Valibot-specific invalid-input recovery for required schemas.
  if (defaultValue !== undefined && !optional && defaultMode === 'fallback') {
    result = `v.fallback(${result}, ${formatDefault(defaultValue)})`
  }
  result = pipe(result, actions)
  return result
}
