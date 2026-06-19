import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { Infinite, PluginVueQuery } from '../types.ts'
import { buildGroupedRequestParam } from '@internals/tanstack-query'
import { buildStatusUnionType, getComments, maybeRefOrGetter, resolveErrorNames, resolveSuccessNames } from '../utils.ts'
import { buildQueryKeyParamsNode } from './QueryKey.tsx'
import { getQueryOptionsParams } from './QueryOptions.tsx'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
  initialPageParam: Infinite['initialPageParam']
  queryParam?: Infinite['queryParam']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function buildInfiniteQueryParamsNode(
  node: ast.OperationNode,
  options: {
    dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  const { dataReturnType, resolver } = options
  const successNames = resolveSuccessNames(node, resolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : resolver.resolveResponseName(node)
  const requestName = node.requestBody?.content?.[0]?.schema ? resolver.resolveDataName(node) : null
  const errorNames = resolveErrorNames(node, resolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, resolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const optionsParam = ast.factory.createFunctionParameter({
    name: 'options',
    type: `{
  query?: Partial<UseInfiniteQueryOptions<${[TData, TError, 'TQueryData', 'TQueryKey', 'TQueryData'].join(', ')}>> & { client?: QueryClient },
  client?: ${requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }'}
}`,
    default: '{}',
  })

  const groupedParam = buildGroupedRequestParam(node, { resolver, memberTypeWrapper: maybeRefOrGetter })

  return ast.factory.createFunctionParameters({ params: [groupedParam, optionsParam].filter((param): param is ast.FunctionParameterNode => param !== null) })
}

export function InfiniteQuery({ name, queryKeyTypeName, queryOptionsName, queryKeyName, dataReturnType, node, tsResolver }: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`
  const returnType = `UseInfiniteQueryReturnType<${['TData', TError].join(', ')}> & { queryKey: TQueryKey }`
  const generics = [`TData = InfiniteData<${TData}>`, `TQueryData = ${TData}`, `TQueryKey extends QueryKey = ${queryKeyTypeName}`]

  const queryKeyParamsNode = buildQueryKeyParamsNode(node, { resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const queryOptionsParamsNode = getQueryOptionsParams(node, { resolver: tsResolver })
  const queryOptionsParamsCall = callPrinter.print(queryOptionsParamsNode) ?? ''

  const paramsNode = buildInfiniteQueryParamsNode(node, { dataReturnType, resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export generics={generics.join(', ')} params={paramsSignature} JSDoc={{ comments: getComments(node) }}>
        {`
       const { query: queryConfig = {}, client: config = {} } = options ?? {}
       const { client: queryClient, ...resolvedOptions } = queryConfig
       const queryKey = (resolvedOptions && 'queryKey' in resolvedOptions ? toValue(resolvedOptions.queryKey) : undefined) ?? ${queryKeyName}(${queryKeyParamsCall})

       const queryResult = useInfiniteQuery({
        ...${queryOptionsName}(${queryOptionsParamsCall}),
        ...resolvedOptions,
        queryKey
       } as unknown as UseInfiniteQueryOptions<${TData}, ${TError}, ${TData}, TQueryKey, ${TData}>, toValue(queryClient)) as ${returnType}

       queryResult.queryKey = queryKey as TQueryKey

       return queryResult
       `}
      </Function>
    </File.Source>
  )
}
