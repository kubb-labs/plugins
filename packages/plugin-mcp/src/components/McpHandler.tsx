import { buildOperationComments, buildRequestParamsSignature } from '@internals/shared'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'

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
  node: ast.OperationNode
  /**
   * TypeScript resolver for resolving param/data/response type names.
   */
  resolver: ResolverTs
}

const requestGroupOrder = ['path', 'query', 'headers', 'body'] as const

export function McpHandler({ name, clientName, node, resolver }: Props): KubbReactNode {
  if (!ast.isHttpOperationNode(node)) return null

  const { signature, groups } = buildRequestParamsSignature(node, resolver, { isConfigurable: false })
  const paramsSignature = [signature, 'request: RequestHandlerExtra<ServerRequest, ServerNotification>'].filter(Boolean).join(', ')

  // Forward the same grouped config the contract `<op>` expects, so MCP behaves like every other
  // client consumer instead of re-implementing request building. The `<op>` always takes one
  // required options object, so a param-less operation still passes an empty `{}`.
  const callArgs = requestGroupOrder.filter((key) => groups[key])
  const callConfig = callArgs.length ? `{ ${callArgs.join(', ')} }` : '{}'

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
        {`const res = await ${clientName}(${callConfig})`}
        <br />
        {callToolResult}
      </Function>
    </File.Source>
  )
}
