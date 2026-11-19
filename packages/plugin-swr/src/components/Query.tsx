import type { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { Function, printParams } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildHookParams, buildQueryKeyParams, buildQueryOptionsParams, buildResponseTypes } from '@internals/tanstack-query'
import type { HookResultProps } from '@internals/tanstack-query'
import { buildClientOptionType, buildOperationComments as getComments } from '@internals/shared'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
} & HookResultProps

export function Query({ name, queryKeyTypeName, queryOptionsName, queryKeyName, node, tsResolver, returnType, typedHeaders }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver, { returnType, typedHeaders })
  const generics = [TData, TError, `${queryKeyTypeName} | null`]

  const queryKeyParamsNode = buildQueryKeyParams(node, { resolver: tsResolver })
  const queryKeyParamsCall = printParams(queryKeyParamsNode, 'call')

  const queryOptionsParamsNode = buildQueryOptionsParams(node, { resolver: tsResolver })
  const queryOptionsParamsCall = printParams(queryOptionsParamsNode, 'call')

  const paramsNode = buildHookParams(node, {
    resolver: tsResolver,
    optionsType: `{
  query?: SWRConfiguration<${[TData, TError].join(', ')}>,
  client?: ${buildClientOptionType()},
  shouldFetch?: boolean,
  immutable?: boolean
}`,
  })

  return (
    <Function name={name} export params={paramsNode} comments={getComments(node)}>
      {`
       const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

       const queryKey = ${queryKeyName}(${queryKeyParamsCall})

       return useSWR<${generics.join(', ')}>(
        shouldFetch ? queryKey : null,
        {
          ...${queryOptionsName}(${queryOptionsParamsCall}),
          ...(immutable ? {
              revalidateIfStale: false,
              revalidateOnFocus: false,
              revalidateOnReconnect: false
            } : { }),
          ...queryOptions,
        }
       )
       `}
    </Function>
  )
}
