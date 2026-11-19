import type { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { Function, printParams } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildCallResultBody, buildQueryOptionsParams, buildClientCall } from '@internals/tanstack-query'
import type { CallReturnTypeProps } from '@internals/tanstack-query'
import { buildQueryKeyParams, buildResponseTypes } from '@internals/tanstack-query'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
} & CallReturnTypeProps

export function QueryOptions({ name, clientName, node, tsResolver, queryKeyName, clientReturnType, returnType, typedHeaders }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver, { returnType, typedHeaders })

  const queryKeyParamsNode = buildQueryKeyParams(node, { resolver: tsResolver })
  const queryKeyParamsCall = printParams(queryKeyParamsNode, 'call')

  const paramsNode = buildQueryOptionsParams(node, { resolver: tsResolver })
  const queryFnBody = buildCallResultBody(buildClientCall(node, { clientName, signal: true }), { clientReturnType, returnType })

  return (
    <Function name={name} export params={paramsNode}>
      {`
      const queryKey = ${queryKeyName}(${queryKeyParamsCall})
      return queryOptions<${TData}, ${TError}, ${TData}, typeof queryKey>({
       queryKey,
       queryFn: async ({ signal }) => {
          ${queryFnBody}
       },
      })
`}
    </Function>
  )
}
