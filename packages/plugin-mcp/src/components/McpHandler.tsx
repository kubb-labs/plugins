import { ast } from '@internals/ast'
import { buildOperationComments, buildRequestParamsSignature, castToClientOptions } from '@internals/shared'
import type { ResolverTs } from '@kubb/plugin-ts'
import { Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'

export type McpHandlerProps = {
  /**
   * Name of the handler function.
   */
  name: string
  /**
   * Name of the contract client `<op>` the handler calls.
   */
  clientName: string
  /**
   * AST operation node.
   */
  node: ast.HttpOperationNode
  /**
   * TypeScript resolver for resolving param/data/response type names.
   */
  resolver: ResolverTs
  /**
   * The registered client plugin's `returnType`, read by the caller off `resolveClientOperation`.
   */
  returnType?: 'full' | 'data' | 'plain'
}

export function McpHandler({ name, clientName, node, resolver, returnType = 'full' }: McpHandlerProps): KubbReactNode {
  const { signature, names: callArgs } = buildRequestParamsSignature(node, resolver, { isConfigurable: false })
  const paramsSignature = [signature, 'ctx: ServerContext'].filter(Boolean).join(', ')

  // Forward the grouped config and MCP cancellation signal through the contract client. `throwOnError: true`
  // pins the result shape, since `throwOnErrorDefault: false` would otherwise resolve to the full result.
  const callConfig = `{ ${[...callArgs, 'signal: ctx.mcpReq.signal', 'throwOnError: true'].join(', ')} }`
  // Tool arguments carry no media type, so the call takes the client's default one.
  const callArg = ast.http.getRequestGroups(node).hasContentTypeChoice ? castToClientOptions(callConfig, clientName, returnType) : callConfig
  const body = returnType === 'data' ? 'res' : 'res.data'

  const callToolResult = `return {
  content: [
    {
      type: 'text',
      text: JSON.stringify(${body}) ?? ''
    }
  ],
  structuredContent: { data: ${body} }
}`

  return (
    <Function name={name} async export params={paramsSignature} JSDoc={{ comments: buildOperationComments(node) }} returnType={'CallToolResult'}>
      {`const res = await ${clientName}(${callArg})`}
      <br />
      {callToolResult}
    </Function>
  )
}
