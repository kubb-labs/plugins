import type { ast } from '@internals/ast'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildCallResultBody, buildQueryOptionsParams, buildClientCall } from '@internals/tanstack-query'
import type { CallReturnTypeProps } from '@internals/tanstack-query'

export type QueryOptionsProps = {
  name: string
  clientName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
} & CallReturnTypeProps

const declarationPrinter = functionPrinter({ mode: 'declaration' })

export function QueryOptions({ name, clientName, node, tsResolver, clientReturnType, returnType }: QueryOptionsProps): KubbReactNode {
  const paramsNode = buildQueryOptionsParams(node, { resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const fetcherBody = buildCallResultBody(buildClientCall(node, { clientName, signal: false }), { clientReturnType, returnType })

  return (
    <Function name={name} export params={paramsSignature}>
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
