import type { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildCallResultBody, buildQueryOptionsParams, buildClientCall } from '@internals/tanstack-query'
import type { CallReturnTypeProps } from '@internals/tanstack-query'

type Props = {
  name: string
  clientName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
} & CallReturnTypeProps

export function QueryOptions({ name, clientName, node, tsResolver, clientReturnType, returnType }: Props): KubbReactNode {
  const paramsNode = buildQueryOptionsParams(node, { resolver: tsResolver })
  const fetcherBody = buildCallResultBody(buildClientCall(node, { clientName, signal: false }), { clientReturnType, returnType })

  return (
    <Function name={name} export params={paramsNode}>
      {`
      return {
        fetcher: async () => {
          ${fetcherBody}
        },
      }
`}
    </Function>
  )
}
