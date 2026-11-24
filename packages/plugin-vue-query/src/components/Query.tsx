import type { ast } from '@internals/ast'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildHookParams, buildQueryKeyParams, buildResponseTypes, maybeRefOrGetter, resolvePageParamType } from '@internals/tanstack-query'
import type { HookResultProps, Infinite } from '@internals/tanstack-query'
import { buildClientOptionType, buildOperationComments } from '@internals/shared'
import { getQueryOptionsParams } from './QueryOptions.tsx'

export type QueryProps = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  /**
   * Emits the `useInfiniteQuery` variant of the hook instead of `useQuery`. Carries the options the page param type is read from.
   */
  infinite?: Pick<Infinite, 'initialPageParam' | 'queryParam'>
} & HookResultProps

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function Query({
  name,
  queryKeyTypeName,
  queryOptionsName,
  queryKeyName,
  node,
  tsResolver,
  infinite,
  returnType,
  typedHeaders,
}: QueryProps): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver, { returnType, typedHeaders })
  const optionsName = infinite ? 'UseInfiniteQueryOptions' : 'UseQueryOptions'
  const hookName = infinite ? 'useInfiniteQuery' : 'useQuery'
  const resultType = `${infinite ? 'UseInfiniteQueryReturnType' : 'UseQueryReturnType'}<${['TData', TError].join(', ')}> & { queryKey: TQueryKey }`
  const generics = [
    infinite ? `TData = InfiniteData<${TData}>` : `TData = ${TData}`,
    `TQueryData = ${TData}`,
    `TQueryKey extends QueryKey = ${queryKeyTypeName}`,
  ]
  const pageParamType = infinite
    ? resolvePageParamType(node, { resolver: tsResolver, initialPageParam: infinite.initialPageParam, queryParam: infinite.queryParam }).pageParamType
    : null
  const optionsGenerics = pageParamType ? ['TQueryData', TError, 'TData', 'TQueryKey', pageParamType] : [TData, TError, 'TData', 'TQueryData', 'TQueryKey']
  const castGenerics = pageParamType ? [TData, TError, 'TData', 'TQueryKey', pageParamType] : [TData, TError, 'TData', TData, 'TQueryKey']

  const queryKeyParamsNode = buildQueryKeyParams(node, { resolver: tsResolver, memberTypeWrapper: maybeRefOrGetter })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const queryOptionsParamsNode = getQueryOptionsParams(node, { resolver: tsResolver })
  const queryOptionsParamsCall = callPrinter.print(queryOptionsParamsNode) ?? ''

  // Vue-query wraps each grouped operation param with MaybeRefOrGetter
  const paramsNode = buildHookParams(node, {
    resolver: tsResolver,
    memberTypeWrapper: maybeRefOrGetter,
    optionsType: `{
  query?: Partial<${optionsName}<${optionsGenerics.join(', ')}>> & { client?: QueryClient },
  client?: ${buildClientOptionType()}
}`,
  })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <Function name={name} export generics={generics.join(', ')} params={paramsSignature} JSDoc={{ comments: buildOperationComments(node) }}>
      {`
       const { query: queryConfig = {}, client: config = {} } = options ?? {}
       const { client: queryClient, ...resolvedOptions } = queryConfig
       const queryKey = (resolvedOptions && 'queryKey' in resolvedOptions ? toValue(resolvedOptions.queryKey) : undefined) ?? ${queryKeyName}(${queryKeyParamsCall})

       const queryResult = ${hookName}({
        ...${queryOptionsName}(${queryOptionsParamsCall}),
        ...resolvedOptions,
        queryKey
       } as unknown as ${optionsName}<${castGenerics.join(', ')}>, toValue(queryClient)) as ${resultType}

       queryResult.queryKey = queryKey as TQueryKey

       return queryResult
       `}
    </Function>
  )
}
