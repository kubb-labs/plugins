import { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildCallResultBody, buildClientCall, buildQueryKeyParams, buildQueryOptionsParams, buildResponseTypes } from '@internals/tanstack-query'
import type { CallReturnTypeProps } from '@internals/tanstack-query'
import { maybeRefOrGetter } from '../utils.ts'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
} & CallReturnTypeProps

export function getQueryOptionsParams(node: ast.OperationNode, options: { resolver: ResolverTs }): ast.FunctionParametersNode {
  return buildQueryOptionsParams(node, { resolver: options.resolver, memberTypeWrapper: maybeRefOrGetter })
}

export function QueryOptions({ name, clientName, node, tsResolver, queryKeyName, clientReturnType, returnType, typedHeaders }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver, { returnType, typedHeaders })

  const queryKeyParamsNode = buildQueryKeyParams(node, { resolver: tsResolver, memberTypeWrapper: maybeRefOrGetter })
  const queryKeyParamsCall = ast.params.print(queryKeyParamsNode, 'call')

  const paramsNode = getQueryOptionsParams(node, { resolver: tsResolver })
  const queryFnBody = buildCallResultBody(buildClientCall(node, { clientName, signal: true, unwrapName: (name) => `toValue(${name})` }), {
    clientReturnType,
    returnType,
  })

  return (
    <Function name={name} export params={paramsNode}>
      {`
      const queryKey = ${queryKeyName}(${queryKeyParamsCall})
      return queryOptions<${TData}, ${TError}, ${TData}>({
       queryKey,
       queryFn: async ({ signal }) => {
          ${queryFnBody}
       },
      })
`}
    </Function>
  )
}
