import type { ast } from 'kubb/kit'
import type { FunctionParameterNode, FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { Infinite, PluginReactQuery } from '../types.ts'
import { buildGroupedRequestParam } from '@internals/tanstack-query'
import { buildClientOptionType, buildResolvedRequestParams, buildResponseTypes, getComments, maybeValueOrGetter, resolvePageParamType } from '../utils.ts'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  initialPageParam: Infinite['initialPageParam']
  queryParam?: Infinite['queryParam']
  customOptions: PluginReactQuery['resolvedOptions']['customOptions']
  /**
   * Emits the `useSuspenseInfiniteQuery` variant of the hook instead of `useInfiniteQuery`.
   * Only the hook, observer options, and result type names change.
   */
  suspense?: boolean
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

function buildInfiniteQueryParamsNode(
  node: ast.OperationNode,
  options: {
    resolver: ResolverTs
    pageParamGeneric: string
    observerOptionsName: string
  },
): FunctionParametersNode {
  const { resolver, pageParamGeneric, observerOptionsName } = options

  const optionsParam = createFunctionParameter({
    name: 'options',
    type: `{
  query?: Partial<${observerOptionsName}<TQueryFnData, TError, TData, TQueryKey, ${pageParamGeneric}>> & { client?: QueryClient },
  client?: ${buildClientOptionType()}
}`,
    default: '{}',
  })

  const groupedParam = buildGroupedRequestParam(node, { resolver, memberTypeWrapper: maybeValueOrGetter })

  return createFunctionParameters({ params: [groupedParam, optionsParam].filter((param): param is FunctionParameterNode => param !== null) })
}

export function InfiniteQuery({
  name,
  queryKeyTypeName,
  queryOptionsName,
  queryKeyName,
  node,
  tsResolver,
  initialPageParam,
  queryParam,
  customOptions,
  suspense,
}: Props): KubbReactNode {
  const { TData: responseType, TError: errorType } = buildResponseTypes(node, tsResolver)

  const { pageParamType } = resolvePageParamType(node, { resolver: tsResolver, initialPageParam, queryParam })

  const hookName = suspense ? 'useSuspenseInfiniteQuery' : 'useInfiniteQuery'
  const observerOptionsName = suspense ? 'UseSuspenseInfiniteQueryOptions' : 'InfiniteQueryObserverOptions'
  const resultTypeName = suspense ? 'UseSuspenseInfiniteQueryResult' : 'UseInfiniteQueryResult'
  const returnType = `${resultTypeName}<TData, TError> & { queryKey: TQueryKey }`
  const generics = [
    `TQueryFnData = ${responseType}`,
    `TError = ${errorType}`,
    'TData = InfiniteData<TQueryFnData>',
    `TQueryKey extends QueryKey = ${queryKeyTypeName}`,
    `TPageParam = ${pageParamType}`,
  ]

  const resolvedParams = buildResolvedRequestParams(node)
  const queryKeyArgs = resolvedParams ? 'resolvedParams' : ''
  const queryOptionsArgs = resolvedParams ? 'resolvedParams, config' : 'config'

  const paramsNode = buildInfiniteQueryParamsNode(node, {
    resolver: tsResolver,
    pageParamGeneric: 'TPageParam',
    observerOptionsName,
  })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export generics={generics.join(', ')} params={paramsSignature} returnType={undefined} JSDoc={{ comments: getComments(node) }}>
        {`
       const { query: queryConfig = {}, client: config = {} } = options ?? {}
       const { client: queryClient, ...resolvedOptions } = queryConfig${resolvedParams ? `\n       const resolvedParams = ${resolvedParams}` : ''}
       const queryKey = resolvedOptions?.queryKey ?? ${queryKeyName}(${queryKeyArgs})${customOptions ? `\n       const customOptions = ${customOptions.name}({ hookName: '${name}', operationId: '${node.operationId}' })` : ''}

       const queryResult = ${hookName}({
        ...${queryOptionsName}(${queryOptionsArgs}),${customOptions ? '\n        ...customOptions,' : ''}
        ...resolvedOptions,
        queryKey,
       } as unknown as ${observerOptionsName}<TQueryFnData, TError, TData, TQueryKey, TPageParam>, queryClient) as ${returnType}

       queryResult.queryKey = queryKey as TQueryKey

       return queryResult
       `}
      </Function>
    </File.Source>
  )
}
