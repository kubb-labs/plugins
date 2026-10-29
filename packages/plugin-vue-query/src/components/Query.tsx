import type { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildHookParams, buildQueryKeyParams, buildResponseTypes, maybeRefOrGetter } from '@internals/tanstack-query'
import { buildClientOptionType, getComments } from '../utils.ts'
import { getQueryOptionsParams } from './QueryOptions.tsx'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  /**
   * Emits the `useInfiniteQuery` variant of the hook instead of `useQuery`.
   */
  infinite?: boolean
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function Query({ name, queryKeyTypeName, queryOptionsName, queryKeyName, node, tsResolver, infinite }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver)
  const optionsName = infinite ? 'UseInfiniteQueryOptions' : 'UseQueryOptions'
  const hookName = infinite ? 'useInfiniteQuery' : 'useQuery'
  const returnType = `${infinite ? 'UseInfiniteQueryReturnType' : 'UseQueryReturnType'}<${['TData', TError].join(', ')}> & { queryKey: TQueryKey }`
  const generics = [
    infinite ? `TData = InfiniteData<${TData}>` : `TData = ${TData}`,
    `TQueryData = ${TData}`,
    `TQueryKey extends QueryKey = ${queryKeyTypeName}`,
  ]
  const optionsGenerics = infinite ? [TData, TError, 'TQueryData', 'TQueryKey', 'TQueryData'] : [TData, TError, 'TData', 'TQueryData', 'TQueryKey']
  const castGenerics = infinite ? [TData, TError, TData, 'TQueryKey', TData] : [TData, TError, 'TData', TData, 'TQueryKey']

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
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export generics={generics.join(', ')} params={paramsSignature} JSDoc={{ comments: getComments(node) }}>
        {`
       const { query: queryConfig = {}, client: config = {} } = options ?? {}
       const { client: queryClient, ...resolvedOptions } = queryConfig
       const queryKey = (resolvedOptions && 'queryKey' in resolvedOptions ? toValue(resolvedOptions.queryKey) : undefined) ?? ${queryKeyName}(${queryKeyParamsCall})

       const queryResult = ${hookName}({
        ...${queryOptionsName}(${queryOptionsParamsCall}),
        ...resolvedOptions,
        queryKey
       } as unknown as ${optionsName}<${castGenerics.join(', ')}>, toValue(queryClient)) as ${returnType}

       queryResult.queryKey = queryKey as TQueryKey

       return queryResult
       `}
      </Function>
    </File.Source>
  )
}
