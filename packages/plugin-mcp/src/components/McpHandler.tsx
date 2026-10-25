import { buildOperationComments, buildRequestParamsSignature, castToClientOptions, hasRequestContentTypeChoice } from '@internals/shared'
import type { ast } from 'kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'

type Props = {
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

const requestGroupOrder = ['path', 'query', 'headers', 'body'] as const

export function McpHandler({ name, clientName, node, resolver, returnType = 'full' }: Props): KubbReactNode {
  const { signature, groups } = buildRequestParamsSignature(node, resolver, { isConfigurable: false })
  const paramsSignature = [signature, 'ctx: ServerContext'].filter(Boolean).join(', ')

  // Forward the grouped config and MCP cancellation signal through the contract client. `throwOnError: true`
  // pins the result shape, since `throwOnErrorDefault: false` would otherwise resolve to the full result.
  const callArgs = requestGroupOrder.filter((key) => groups[key])
  const callConfig = `{ ${[...callArgs, 'signal: ctx.mcpReq.signal', 'throwOnError: true'].join(', ')} }`
  // Tool arguments carry no media type, so the call takes the client's default one.
  const callArg = hasRequestContentTypeChoice(node) ? castToClientOptions(callConfig, clientName, returnType) : callConfig
  const body = returnType === 'data' ? 'res' : 'res.data'

  const callToolResult = `return {
  content: [
    {
      type: 'text',
      text: JSON.stringify(${body})
    }
  ],
  structuredContent: { data: ${body} }
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
        returnType={'CallToolResult'}
      >
        {`const res = await ${clientName}(${callArg})`}
        <br />
        {callToolResult}
      </Function>
    </File.Source>
  )
}
