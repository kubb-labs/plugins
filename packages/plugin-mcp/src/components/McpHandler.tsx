import { buildOperationComments, buildTransformedParamsMapping, getOperationParameters } from '@internals/shared'
import { camelCase, isValidVarName, URLPath } from '@internals/utils'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginMcp } from '../types.ts'

type Props = {
  /**
   * Name of the handler function.
   */
  name: string
  /**
   * AST operation node.
   */
  node: ast.OperationNode
  /**
   * TypeScript resolver for resolving param/data/response type names.
   */
  resolver: ResolverTs
  /**
   * Base URL prepended to every generated request URL.
   */
  baseURL: string | null | undefined
  /**
   * Return type when calling fetch.
   * - 'data' returns response data only.
   * - 'full' returns the full response object.
   * @default 'data'
   */
  dataReturnType: PluginMcp['resolvedOptions']['client']['dataReturnType']
  /**
   * How to style your params.
   */
  paramsCasing?: PluginMcp['resolvedOptions']['paramsCasing']
}

/**
 * Generate a remapping statement: `const mappedX = x ? { "orig": x.camel, ... } : undefined`
 */
function buildRemappingCode(mapping: Record<string, string>, varName: string, sourceName: string): string {
  const pairs = Object.entries(mapping)
    .map(([orig, camel]) => `"${orig}": ${sourceName}.${camel}`)
    .join(', ')
  return `const ${varName} = ${sourceName} ? { ${pairs} } : undefined`
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export function McpHandler({ name, node, resolver, baseURL, dataReturnType, paramsCasing }: Props): KubbReactNode {
  const urlPath = new URLPath(node.path)
  const contentType = node.requestBody?.content?.[0]?.contentType
  const isFormData = contentType === 'multipart/form-data'

  const { query: queryParams, header: headerParams } = getOperationParameters(node, { paramsCasing })
  const { path: originalPathParams, query: originalQueryParams, header: originalHeaderParams } = getOperationParameters(node)

  const requestName = node.requestBody?.content?.[0]?.schema ? resolver.resolveDataName(node) : undefined
  const responseName = resolver.resolveResponseName(node)

  const errorResponses = node.responses.filter((r) => Number(r.statusCode) >= 400).map((r) => resolver.resolveResponseStatusName(node, r.statusCode))
  const errorType = errorResponses.length > 0 ? errorResponses.join(' | ') : 'Error'

  const TError = `ResponseErrorConfig<${errorType}>`
  const generics = [responseName, TError, requestName || 'unknown'].filter(Boolean)

  const paramsNode = ast.createOperationParams(node, {
    paramsType: 'object',
    pathParamsType: 'inline',
    resolver,
    paramsCasing,
  })
  const baseParamsSignature = declarationPrinter.print(paramsNode) ?? ''
  const paramsSignature = baseParamsSignature
    ? `${baseParamsSignature}, request: RequestHandlerExtra<ServerRequest, ServerNotification>`
    : 'request: RequestHandlerExtra<ServerRequest, ServerNotification>'

  const pathParamsMapping = paramsCasing ? buildTransformedParamsMapping(originalPathParams, camelCase) : undefined
  const queryParamsMapping = paramsCasing ? buildTransformedParamsMapping(originalQueryParams, camelCase) : undefined
  const headerParamsMapping = paramsCasing ? buildTransformedParamsMapping(originalHeaderParams, camelCase) : undefined

  const contentTypeHeader =
    contentType && contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : undefined
  const headers = [headerParams.length ? (headerParamsMapping ? '...mappedHeaders' : '...headers') : undefined, contentTypeHeader].filter(Boolean)

  const fetchConfig: string[] = []
  fetchConfig.push(`method: ${JSON.stringify(node.method.toUpperCase())}`)
  fetchConfig.push(`url: ${urlPath.template}`)
  if (baseURL) fetchConfig.push(`baseURL: \`${baseURL}\``)
  if (queryParams.length) fetchConfig.push(queryParamsMapping ? 'params: mappedParams' : 'params')
  if (requestName) fetchConfig.push(`data: ${isFormData ? 'formData as FormData' : 'requestData'}`)
  if (headers.length) fetchConfig.push(`headers: { ${headers.join(', ')} }`)

  const callToolResult =
    dataReturnType === 'data'
      ? `return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(res.data)
              }
            ],
            structuredContent: { data: res.data }
           }`
      : `return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(res)
              }
            ],
            structuredContent: { data: res.data }
           }`

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        name={name}
        async
        export
        params={paramsSignature}
        JSDoc={{
          comments: buildOperationComments(node),
        }}
        returnType={'Promise<CallToolResult>'}
      >
        {''}
        <br />
        <br />
        {pathParamsMapping &&
          Object.entries(pathParamsMapping)
            .filter(([originalName, camelCaseName]) => originalName !== camelCaseName && isValidVarName(originalName))
            .map(([originalName, camelCaseName]) => `const ${originalName} = ${camelCaseName}`)
            .join('\n')}
        {pathParamsMapping && (
          <>
            <br />
            <br />
          </>
        )}
        {queryParamsMapping && queryParams.length > 0 && (
          <>
            {buildRemappingCode(queryParamsMapping, 'mappedParams', 'params')}
            <br />
            <br />
          </>
        )}
        {headerParamsMapping && headerParams.length > 0 && (
          <>
            {buildRemappingCode(headerParamsMapping, 'mappedHeaders', 'headers')}
            <br />
            <br />
          </>
        )}
        {requestName && 'const requestData = data'}
        <br />
        {isFormData && requestName && 'const formData = buildFormData(requestData)'}
        <br />
        {`const res = await fetch<${generics.join(', ')}>({ ${fetchConfig.join(', ')} }, request)`}
        <br />
        {callToolResult}
      </Function>
    </File.Source>
  )
}
