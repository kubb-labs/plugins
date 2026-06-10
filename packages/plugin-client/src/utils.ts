import { getOperationParameters, getResponseType, resolveSuccessNames } from '@internals/shared'
import type { URLPath } from '@internals/utils'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { createFunctionParams } from './functionParams.ts'
import type { PluginClient } from './types.ts'

/**
 * Builds the discriminated union type string for `dataReturnType: 'full'` return shapes.
 * Each member is `{ status: N; data: StatusNType; statusText: string; headers: Headers }`.
 */
export function buildStatusUnionType(node: ast.OperationNode, tsResolver: ResolverTs): string {
  const members = node.responses.map((r) => {
    const typeName = tsResolver.resolveResponseStatusName(node, r.statusCode)
    return `{ status: ${Number.parseInt(r.statusCode, 10)}; data: ${typeName}; statusText: string; headers: Headers }`
  })
  if (members.length === 1) return members[0]!
  return `(${members.join(' | ')})`
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
 * Builds TypeScript generic parameters for a client method.
 * Includes response type, error type, and optional request type.
 * When `dataReturnType` is `'full'`, the response generic widens to a union of all documented status types.
 */
export function buildGenerics(
  node: ast.OperationNode,
  tsResolver: ResolverTs,
  options: { dataReturnType?: PluginClient['resolvedOptions']['dataReturnType'] } = {},
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
  return [responseName, TError, requestName || 'unknown'].filter(Boolean)
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
}: {
  node: ast.OperationNode
  path: URLPath
  baseURL: string | null | undefined
  tsResolver: ResolverTs
  isFormData: boolean
  isMultipleContentTypes: boolean
  hasFormData: boolean
  headers: Array<string>
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
        params: queryParamsName ? {} : null,
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
 * Applies Zod validation if configured, otherwise uses data directly.
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
  const zodRequestName = zodResolver && parser === 'zod' && node.requestBody?.content?.[0]?.schema ? zodResolver.resolveDataName?.(node) : null
  if (parser === 'zod' && zodRequestName) {
    return `const requestData = ${zodRequestName}.parse(data)`
  }
  if (node.requestBody?.content?.[0]?.schema) {
    return 'const requestData = data'
  }
  return ''
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
 * When `parser` is `'zod'`, pipes the response body through the Zod schema before returning.
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
  const zodResponseName = zodResolver && parser === 'zod' ? zodResolver.resolveResponseName?.(node) : null

  if (dataReturnType === 'full' && tsResolver) {
    const unionType = buildStatusUnionType(node, tsResolver)
    if (parser === 'zod' && zodResponseName) {
      return `return {...res, data: ${zodResponseName}.parse(res.data)} as ${unionType}`
    }
    return `return res as ${unionType}`
  }

  if (dataReturnType === 'data' && parser === 'zod' && zodResponseName) {
    return `return ${zodResponseName}.parse(res.data)`
  }
  return 'return res.data'
}
