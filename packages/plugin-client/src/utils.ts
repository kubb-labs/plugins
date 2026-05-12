import { getOperationParameters } from '@internals/shared'
import type { URLPath } from '@internals/utils'
import type { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { createFunctionParams } from './functionParams.ts'
import type { PluginClient } from './types.ts'

/**
 * Builds HTTP headers array for a client request.
 * Includes Content-Type (if not default) and spreads header parameters if present.
 */
export function buildHeaders(contentType: string, hasHeaderParams: boolean): Array<string> {
  return [
    contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : undefined,
    hasHeaderParams ? '...headers' : undefined,
  ].filter(Boolean) as Array<string>
}

/**
 * Builds TypeScript generic parameters for a client method.
 * Includes response type, error type, and optional request type.
 */
export function buildGenerics(node: ast.OperationNode, tsResolver: ResolverTs): Array<string> {
  const responseName = tsResolver.resolveResponseName(node)
  const requestName = node.requestBody?.content?.[0]?.schema ? tsResolver.resolveDataName(node) : undefined
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
  baseURL: string | undefined
  tsResolver: ResolverTs
  isFormData: boolean
  isMultipleContentTypes: boolean
  hasFormData: boolean
  headers: Array<string>
}) {
  const { query: queryParams } = getOperationParameters(node)
  const queryParamsName = queryParams.length > 0 ? tsResolver.resolveQueryParamsName(node, queryParams[0]!) : undefined
  const requestName = node.requestBody?.content?.[0]?.schema ? tsResolver.resolveDataName(node) : undefined

  return createFunctionParams({
    config: {
      mode: 'object',
      children: {
        requestConfig: {
          mode: 'inlineSpread',
        },
        method: {
          value: JSON.stringify(node.method.toUpperCase()),
        },
        url: {
          value: path.template,
        },
        baseURL: baseURL
          ? {
              value: JSON.stringify(baseURL),
            }
          : undefined,
        params: queryParamsName ? {} : undefined,
        data: requestName
          ? {
              value:
                isMultipleContentTypes && hasFormData
                  ? "contentType === 'multipart/form-data' ? formData as FormData : requestData"
                  : isFormData
                    ? 'formData as FormData'
                    : 'requestData',
            }
          : undefined,
        contentType: isMultipleContentTypes ? {} : undefined,
        headers: headers.length
          ? {
              value: `{ ${headers.join(', ')}, ...requestConfig.headers }`,
            }
          : undefined,
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
  zodResolver?: ResolverZod
}): string {
  const zodRequestName = zodResolver && parser === 'zod' && node.requestBody?.content?.[0]?.schema ? zodResolver.resolveDataName?.(node) : undefined
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
 * Applies Zod validation to response data if configured, otherwise returns raw response.
 */
export function buildReturnStatement({
  dataReturnType,
  parser,
  node,
  zodResolver,
}: {
  dataReturnType: PluginClient['resolvedOptions']['dataReturnType']
  parser: PluginClient['resolvedOptions']['parser'] | undefined
  node: ast.OperationNode
  zodResolver?: ResolverZod
}): string {
  const zodResponseName = zodResolver && parser === 'zod' ? zodResolver.resolveResponseName?.(node) : undefined
  if (dataReturnType === 'full' && parser === 'zod' && zodResponseName) {
    return `return {...res, data: ${zodResponseName}.parse(res.data)}`
  }
  if (dataReturnType === 'data' && parser === 'zod' && zodResponseName) {
    return `return ${zodResponseName}.parse(res.data)`
  }
  if (dataReturnType === 'full' && parser === 'client') {
    return 'return res'
  }
  return 'return res.data'
}
