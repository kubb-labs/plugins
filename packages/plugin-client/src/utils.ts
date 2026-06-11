import { buildStatusUnionType, getOperationParameters, getResponseType, resolveSuccessNames } from '@internals/shared'
import type { URLPath } from '@internals/utils'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { createFunctionParams } from './functionParams.ts'
import type { PluginClient } from './types.ts'

type ParserOption = PluginClient['resolvedOptions']['parser']

/**
 * Returns `true` when any direction of the parser uses Zod (used for dependency checks).
 */
export function isParserEnabled(parser: ParserOption | undefined | false): boolean {
  if (!parser) return false
  if (parser === 'zod') return true
  return !!(parser.request || parser.response)
}

/**
 * Returns `'zod'` when request body parsing is enabled, `null` otherwise.
 * The string shorthand `'zod'` also enables request body parsing (existing behavior).
 */
export function resolveRequestParser(parser: ParserOption | undefined | false): 'zod' | null {
  if (!parser) return null
  if (parser === 'zod') return 'zod'
  return parser.request ?? null
}

/**
 * Returns `'zod'` when query-parameters parsing is enabled, `null` otherwise.
 * Only the object form `{ request: 'zod' }` enables query-params parsing.
 * The string shorthand `'zod'` does not, preserving its existing behavior.
 */
export function resolveQueryParamsParser(parser: ParserOption | undefined | false): 'zod' | null {
  if (!parser || parser === 'zod') return null
  return parser.request ?? null
}

/**
 * Returns `'zod'` when response-direction parsing is enabled, `null` otherwise.
 * `parser: 'zod'` (string shorthand) maps to response parsing and returns `'zod'`.
 */
export function resolveResponseParser(parser: ParserOption | undefined | false): 'zod' | null {
  if (!parser) return null
  if (parser === 'zod') return 'zod'
  return parser.response ?? null
}

export { buildStatusUnionType }

/**
 * The zod validation a generated client applies to response data, resolved by
 * {@link buildZodResponseParse}.
 */
export type ZodResponseParse = {
  /**
   * Expression the generated code calls `.parse(res.data)` on — a schema name or an
   * inline `z.union([...])`.
   */
  expression: string
  /**
   * Schema names the generated file imports from the zod plugin output.
   */
  importNames: Array<string>
  /**
   * Whether the expression references `z` directly, requiring a `z` value import.
   */
  needsZodImport: boolean
}

/**
 * Resolves the zod expression a generated client validates response data with.
 *
 * With `throwOnError`, only success bodies reach the parse, so the success-only
 * `<operation>ResponseSchema` is used. Without it, every documented response resolves, so the
 * per-status schemas join into an inline `z.union` (which needs a `z` value import).
 */
export function buildZodResponseParse(node: ast.OperationNode, zodResolver: ResolverZod, options: { throwOnError: boolean }): ZodResponseParse | null {
  if (options.throwOnError) {
    const name = zodResolver.resolveResponseName?.(node)
    return name ? { expression: name, importNames: [name], needsZodImport: false } : null
  }

  const responsesWithSchema = node.responses.filter((res) => res.content?.some((entry) => entry.schema))
  const statusNames = responsesWithSchema
    .map((res) => zodResolver.resolveResponseStatusName?.(node, res.statusCode))
    .filter((name): name is string => Boolean(name))

  if (statusNames.length === 0) {
    const name = zodResolver.resolveResponseName?.(node)
    return name ? { expression: name, importNames: [name], needsZodImport: false } : null
  }
  if (statusNames.length === 1) {
    return { expression: statusNames[0]!, importNames: statusNames, needsZodImport: false }
  }
  return { expression: `z.union([${statusNames.join(', ')}])`, importNames: statusNames, needsZodImport: true }
}

/**
 * Returns `true` when a generated class file needs a `z` value import — without
 * `throwOnError`, operations with more than one documented response validate with an
 * inline `z.union`.
 */
export function needsZodValueImport(ops: Array<{ node: ast.OperationNode }>, throwOnError: PluginClient['resolvedOptions']['throwOnError']): boolean {
  if (throwOnError !== false) return false
  return ops.some((op) => op.node.responses.filter((res) => res.content?.some((entry) => entry.schema)).length > 1)
}

/**
 * Builds HTTP headers array for a client request.
 * Includes Content-Type (if not default) and spreads header parameters if present.
 */
export function buildHeaders(contentType: string, hasHeaderParams: boolean): Array<string> {
  return [
    contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : null,
    hasHeaderParams ? '...headers' : null,
  ].filter(Boolean) as Array<string>
}

/**
 * Returns the generic type arguments — response, error, and request body — for a generated
 * client call.
 *
 * With `throwOnError` (the default), the response generic only covers success (2xx) status
 * types; without it every documented status can resolve, so the generic widens to all of
 * them. When `parser` is `'zod'` and a request body schema exists, the request type uses
 * `z.output<typeof schema>` to reflect post-transform types (e.g. date coercion).
 */
export function buildGenerics(
  node: ast.OperationNode,
  tsResolver: ResolverTs,
  options: {
    throwOnError?: PluginClient['resolvedOptions']['throwOnError']
    zodResolver?: ResolverZod | null
    parser?: PluginClient['resolvedOptions']['parser']
  } = {},
): Array<string> {
  const statusNames =
    options.throwOnError === false ? node.responses.map((r) => tsResolver.resolveResponseStatusName(node, r.statusCode)) : resolveSuccessNames(node, tsResolver)
  const responseName = statusNames.length > 0 ? statusNames.join(' | ') : tsResolver.resolveResponseName(node)
  const requestName = node.requestBody?.content?.[0]?.schema ? tsResolver.resolveDataName(node) : null
  const errorNames = node.responses.filter((r) => Number.parseInt(r.statusCode, 10) >= 400).map((r) => tsResolver.resolveResponseStatusName(node, r.statusCode))
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const zodRequestName =
    options.parser === 'zod' && options.zodResolver && node.requestBody?.content?.[0]?.schema ? (options.zodResolver.resolveDataName?.(node) ?? null) : null

  const requestGenericType = zodRequestName ? `z.output<typeof ${zodRequestName}>` : requestName || 'unknown'

  return [responseName, TError, requestGenericType].filter(Boolean)
}

/**
 * Builds the parameters object for a class-based client method.
 * Includes URL, method, base URL, headers, and request/response data.
 */
export function buildClassClientParams({
  node,
  path,
  baseURL,
  tsResolver,
  isFormData,
  isMultipleContentTypes,
  hasFormData,
  headers,
  zodQueryParamsName,
  throwOnError = true,
}: {
  node: ast.OperationNode
  path: URLPath
  baseURL: string | null | undefined
  tsResolver: ResolverTs
  isFormData: boolean
  isMultipleContentTypes: boolean
  hasFormData: boolean
  headers: Array<string>
  zodQueryParamsName?: string | null
  throwOnError?: PluginClient['resolvedOptions']['throwOnError']
}) {
  const { query: queryParams } = getOperationParameters(node)
  const queryParamsName = queryParams.length > 0 ? tsResolver.resolveQueryParamsName(node, queryParams[0]!) : null
  const requestName = node.requestBody?.content?.[0]?.schema ? tsResolver.resolveDataName(node) : null
  const responseType = getResponseType(node)

  return createFunctionParams({
    config: {
      mode: 'object',
      children: {
        requestConfig: {
          mode: 'inlineSpread',
        },
        method: {
          value: JSON.stringify(ast.isHttpOperationNode(node) ? node.method.toUpperCase() : ''),
        },
        url: {
          value: path.template,
        },
        baseURL: baseURL
          ? {
              value: JSON.stringify(baseURL),
            }
          : null,
        params: queryParamsName ? (zodQueryParamsName ? { value: 'requestParams' } : {}) : null,
        data: requestName
          ? {
              value:
                isMultipleContentTypes && hasFormData
                  ? "contentType === 'multipart/form-data' ? formData as FormData : requestData"
                  : isFormData
                    ? 'formData as FormData'
                    : 'requestData',
            }
          : null,
        contentType: isMultipleContentTypes ? {} : null,
        responseType: responseType ? { value: JSON.stringify(responseType) } : null,
        throwOnError: throwOnError === false ? { value: 'false' } : null,
        headers: headers.length
          ? {
              value: `{ ${headers.join(', ')}, ...requestConfig.headers }`,
            }
          : null,
      },
    },
  })
}

/**
 * Builds the request data parsing line for client methods.
 * Applies Zod validation when `parser.request === 'zod'`, otherwise assigns data directly.
 */
export function buildRequestDataLine({
  parser,
  node,
  zodResolver,
}: {
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  node: ast.OperationNode
  zodResolver?: ResolverZod | null
}): string {
  const requestParser = resolveRequestParser(parser)
  const zodRequestName = zodResolver && requestParser === 'zod' && node.requestBody?.content?.[0]?.schema ? zodResolver.resolveDataName?.(node) : null
  if (requestParser === 'zod' && zodRequestName) {
    return `const requestData = ${zodRequestName}.parse(data)`
  }
  if (node.requestBody?.content?.[0]?.schema) {
    return 'const requestData = data'
  }
  return ''
}

/**
 * Builds the query parameters parsing line for client methods.
 * Returns an empty string when no query params exist or query-params parsing is not enabled.
 * Only the object form `parser: { request: 'zod' }` triggers this. `parser: 'zod'` does not.
 */
export function buildQueryParamsLine({
  parser,
  node,
  zodResolver,
}: {
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  node: ast.OperationNode
  zodResolver?: ResolverZod | null
}): string {
  if (resolveQueryParamsParser(parser) !== 'zod' || !zodResolver) return ''
  const { query: queryParams } = getOperationParameters(node)
  if (queryParams.length === 0) return ''
  const zodQueryParamsName = zodResolver.resolveQueryParamsName?.(node, queryParams[0]!)
  if (!zodQueryParamsName) return ''
  return `const requestParams = ${zodQueryParamsName}.parse(params)`
}

/**
 * Builds the form data conversion line for file upload requests.
 * Returns empty string if not applicable.
 */
export function buildFormDataLine(isFormData: boolean, hasRequest: boolean): string {
  return isFormData && hasRequest ? 'const formData = buildFormData(requestData)' : ''
}

/**
 * Builds the return statement for a client method.
 * When `dataReturnType` is `'full'`, casts the response to the status-discriminated union type.
 * When `parser.response` is `'zod'`, pipes the response body through the Zod schema before returning.
 */
export function buildReturnStatement({
  dataReturnType,
  throwOnError = true,
  parser,
  node,
  zodResolver,
  tsResolver,
}: {
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  throwOnError?: PluginClient['resolvedOptions']['throwOnError']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  node: ast.OperationNode
  zodResolver?: ResolverZod | null
  tsResolver?: ResolverTs | null
}): string {
  const responseParser = resolveResponseParser(parser)
  const zodParse = zodResolver && responseParser === 'zod' ? buildZodResponseParse(node, zodResolver, { throwOnError }) : null

  if (dataReturnType === 'full' && tsResolver) {
    const unionType = buildStatusUnionType(node, tsResolver, { successOnly: throwOnError })
    if (zodParse) {
      return `return {...res, data: ${zodParse.expression}.parse(res.data)} as ${unionType}`
    }
    return `return res as ${unionType}`
  }

  if (dataReturnType === 'data' && zodParse) {
    return `return ${zodParse.expression}.parse(res.data)`
  }
  return 'return res.data'
}
