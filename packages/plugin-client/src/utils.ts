import { buildStatusUnionType, getOperationParameters, getResponseType, resolveSuccessNames } from '@internals/shared'
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
 * Builds HTTP headers array for a client request.
 * Includes Content-Type (if not default) and spreads header parameters if present.
 * `headerSpread` is the expression spread into the headers object, swapped to
 * `...mappedHeaders` when the wire names need remapping to camelCase.
 */
export function buildHeaders(contentType: string, hasHeaderParams: boolean, headerSpread = '...headers'): Array<string> {
  return [
    contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : null,
    hasHeaderParams ? headerSpread : null,
  ].filter(Boolean) as Array<string>
}

/**
 * Returns the generic type arguments — response, error, and request body — for a generated
 * client call.
 *
 * When `dataReturnType` is `'full'`, the response generic widens to a union of all documented
 * status types. When `parser` is `'zod'` and a request body schema exists, the request type
 * uses `z.input<typeof schema>` to match what the user provides before zod transforms/defaults are applied.
 */
export function buildGenerics(
  node: ast.OperationNode,
  tsResolver: ResolverTs,
  options: {
    dataReturnType?: PluginClient['resolvedOptions']['dataReturnType']
    zodResolver?: ResolverZod | null
    parser?: PluginClient['resolvedOptions']['parser']
  } = {},
): Array<string> {
  const allStatusNames = node.responses.map((r) => tsResolver.resolveResponseStatusName(node, r.statusCode))
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName =
    options.dataReturnType === 'full'
      ? allStatusNames.length > 0
        ? allStatusNames.join(' | ')
        : tsResolver.resolveResponseName(node)
      : successNames.length > 0
        ? successNames.join(' | ')
        : tsResolver.resolveResponseName(node)
  const requestName = node.requestBody?.content?.[0]?.schema ? tsResolver.resolveDataName(node) : null
  const errorNames = node.responses.filter((r) => Number.parseInt(r.statusCode, 10) >= 400).map((r) => tsResolver.resolveResponseStatusName(node, r.statusCode))
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const zodRequestName =
    options.parser === 'zod' && options.zodResolver && node.requestBody?.content?.[0]?.schema ? (options.zodResolver.resolveDataName?.(node) ?? null) : null

  const requestGenericType = zodRequestName ? `z.input<typeof ${zodRequestName}>` : requestName || 'unknown'

  return [responseName, TError, requestGenericType].filter(Boolean)
}

/**
 * Builds the parameters object for a class-based client method.
 * Includes URL, method, base URL, headers, and request/response data.
 */
export function buildClassClientParams({
  node,
  url,
  baseURL,
  tsResolver,
  isFormData,
  isMultipleContentTypes,
  hasFormData,
  headers,
  zodQueryParamsName,
  queryParamsMapping,
}: {
  node: ast.OperationNode
  url: string
  baseURL: string | null | undefined
  tsResolver: ResolverTs
  isFormData: boolean
  isMultipleContentTypes: boolean
  hasFormData: boolean
  headers: Array<string>
  zodQueryParamsName?: string | null
  queryParamsMapping?: Record<string, string> | null
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
          value: url,
        },
        baseURL: baseURL
          ? {
              value: JSON.stringify(baseURL),
            }
          : null,
        params: queryParamsName ? (zodQueryParamsName ? { value: 'requestParams' } : queryParamsMapping ? { value: 'mappedParams' } : {}) : null,
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
  parser,
  node,
  zodResolver,
  tsResolver,
}: {
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  node: ast.OperationNode
  zodResolver?: ResolverZod | null
  tsResolver?: ResolverTs | null
}): string {
  const responseParser = resolveResponseParser(parser)
  const zodResponseName = zodResolver && responseParser === 'zod' ? zodResolver.resolveResponseName?.(node) : null

  if (dataReturnType === 'full' && tsResolver) {
    const unionType = buildStatusUnionType(node, tsResolver)
    if (responseParser === 'zod' && zodResponseName) {
      return `return {...res, data: ${zodResponseName}.parse(res.data)} as ${unionType}`
    }
    return `return res as ${unionType}`
  }

  if (dataReturnType === 'data' && responseParser === 'zod' && zodResponseName) {
    return `return ${zodResponseName}.parse(res.data)`
  }
  return 'return res.data'
}
