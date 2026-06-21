import { buildOperationComments, buildTransformedParamsMapping, getOperationParameters } from '@internals/shared'
import { camelCase, Url } from '@internals/utils'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { createOperationParams, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'

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

export function McpHandler({ name, node, resolver, baseURL }: Props): KubbReactNode {
  if (!ast.isHttpOperationNode(node)) return null
  const contentType = node.requestBody?.content?.[0]?.contentType

  const { query: queryParams, header: headerParams } = getOperationParameters(node)
  const { query: originalQueryParams, header: originalHeaderParams } = getOperationParameters(node, { paramsCasing: 'original' })

  const requestName = node.requestBody?.content?.[0]?.schema ? resolver.resolveDataName(node) : null

  const paramsNode = createOperationParams(node, {
    paramsType: 'object',
    pathParamsType: 'inline',
    resolver,
    paramsCasing: 'camelcase',
  })
  const baseParamsSignature = declarationPrinter.print(paramsNode) ?? ''
  const paramsSignature = baseParamsSignature
    ? `${baseParamsSignature}, request: RequestHandlerExtra<ServerRequest, ServerNotification>`
    : 'request: RequestHandlerExtra<ServerRequest, ServerNotification>'

  const queryParamsMapping = buildTransformedParamsMapping(originalQueryParams, camelCase)
  const headerParamsMapping = buildTransformedParamsMapping(originalHeaderParams, camelCase)

  const headers = [headerParams.length ? (headerParamsMapping ? '...mappedHeaders' : '...headers') : null].filter(Boolean)

  const fetchConfig: Array<string> = []
  fetchConfig.push(`method: ${JSON.stringify(node.method.toUpperCase())}`)
  fetchConfig.push(`url: ${Url.toTemplateString(node.path, { casing: 'camelcase' })}`)
  if (baseURL) fetchConfig.push(`baseURL: \`${baseURL}\``)
  if (queryParams.length) fetchConfig.push(queryParamsMapping ? 'query: mappedParams' : 'query: params')
  if (requestName) fetchConfig.push('body: requestBody')
  // A non-JSON content type is forwarded on the request config; the contract runtime sets the
  // matching `Content-Type` header and serializes the body (URLSearchParams for form-urlencoded,
  // and the multipart boundary is left to the transport).
  if (requestName && contentType && contentType !== 'application/json') fetchConfig.push(`contentType: '${contentType}'`)
  if (headers.length) fetchConfig.push(`headers: { ${headers.join(', ')} }`)

  const callToolResult = `return {
  content: [
    {
      type: 'text',
      text: JSON.stringify(res.data)
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
        {requestName && 'const requestBody = data'}
        <br />
        {`const res = await client({ ${fetchConfig.join(', ')} })`}
        <br />
        {callToolResult}
      </Function>
    </File.Source>
  )
}
