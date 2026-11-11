import {
  buildOperationComments,
  buildRequestParamsSignature,
  castToClientOptions,
  getPrimarySuccessResponse,
  hasRequestContentTypeChoice,
} from '@internals/shared'
import { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'

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

export function McpHandler({ name, clientName, node, resolver, returnType = 'full' }: Props): KubbReactNode {
  const { signature, names: callArgs } = buildRequestParamsSignature(node, resolver, { isConfigurable: false })
  const paramsSignature = [signature, 'ctx: ServerContext'].filter(Boolean).join(', ')

  // Forward the grouped config and MCP cancellation signal through the contract client. `throwOnError: true`
  // pins the result shape, since `throwOnErrorDefault: false` would otherwise resolve to the full result.
  const callConfig = `{ ${[...callArgs, 'signal: ctx.mcpReq.signal', 'throwOnError: true'].join(', ')} }`
  // Tool arguments carry no media type, so the call takes the client's default one.
  const callArg = hasRequestContentTypeChoice(node) ? castToClientOptions(callConfig, clientName, returnType) : callConfig
  const body = returnType === 'data' ? 'res' : 'res.data'
  const response = getPrimarySuccessResponse(node)
  // `JSON.stringify` throws on the `bigint` a validated `int64` holds, so such a result goes out as a JSON number,
  // or as a string past the safe range, which `z.coerce.bigint()` in the output schema reads back.
  const hasBigint = !!response && !!ast.findSchema(response, { predicate: (schema) => schema.type === 'bigint', followRefs: true })

  const callToolResult = hasBigint
    ? `const text = JSON.stringify(${body}, (_key, value) => (typeof value === 'bigint' ? (Number.isSafeInteger(Number(value)) ? Number(value) : String(value)) : value))
return {
  content: [
    {
      type: 'text',
      text
    }
  ],
  structuredContent: { data: text === undefined ? undefined : JSON.parse(text) }
}`
    : `return {
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
