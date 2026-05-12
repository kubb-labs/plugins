import { transformParamTypes } from '@internals/tanstack-query'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { Infinite, PluginVueQuery } from '../types.ts'
import { getComments, resolveErrorNames } from '../utils.ts'
import { QueryKey } from './QueryKey.tsx'
import { getQueryOptionsParams } from './QueryOptions.tsx'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginVueQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
  initialPageParam: Infinite['initialPageParam']
  queryParam?: Infinite['queryParam']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function getParams(
  node: ast.OperationNode,
  options: {
    paramsType: PluginVueQuery['resolvedOptions']['paramsType']
    paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
    pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
    dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  const { paramsType, paramsCasing, pathParamsType, dataReturnType, resolver } = options
  const responseName = resolver.resolveResponseName(node)
  const requestName = node.requestBody?.content?.[0]?.schema ? resolver.resolveDataName(node) : undefined
  const errorNames = resolveErrorNames(node, resolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const optionsParam = ast.createFunctionParameter({
    name: 'options',
    type: ast.createParamsType({
      variant: 'reference',
      name: `{
  query?: Partial<UseInfiniteQueryOptions<${[TData, TError, 'TQueryData', 'TQueryKey', 'TQueryData'].join(', ')}>> & { client?: QueryClient },
  client?: ${requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }'}
}`,
    }),
    default: '{}',
  })

  const baseParams = ast.createOperationParams(node, {
    paramsType,
    pathParamsType: paramsType === 'object' ? 'object' : pathParamsType === 'object' ? 'object' : 'inline',
    paramsCasing,
    resolver,
    extraParams: [optionsParam],
  })

  return transformParamTypes(baseParams, {
    wrapType: (inner) => `MaybeRefOrGetter<${inner}>`,
    shouldWrap: (p) => p.name !== 'options',
  })
}

export function InfiniteQuery({
  name,
  queryKeyTypeName,
  queryOptionsName,
  queryKeyName,
  paramsType,
  paramsCasing,
  pathParamsType,
  dataReturnType,
  node,
  tsResolver,
}: Props): KubbReactNode {
  const responseName = tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`
  const returnType = `UseInfiniteQueryReturnType<${['TData', TError].join(', ')}> & { queryKey: TQueryKey }`
  const generics = [`TData = InfiniteData<${TData}>`, `TQueryData = ${TData}`, `TQueryKey extends QueryKey = ${queryKeyTypeName}`]

  const queryKeyParamsNode = QueryKey.getParams(node, { pathParamsType, paramsCasing, resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const queryOptionsParamsNode = getQueryOptionsParams(node, { paramsType, paramsCasing, pathParamsType, resolver: tsResolver })
  const queryOptionsParamsCall = callPrinter.print(queryOptionsParamsNode) ?? ''

  const paramsNode = getParams(node, { paramsType, paramsCasing, pathParamsType, dataReturnType, resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export generics={generics.join(', ')} params={paramsSignature} JSDoc={{ comments: getComments(node) }}>
        {`
       const { query: queryConfig = {}, client: config = {} } = options ?? {}
       const { client: queryClient, ...resolvedOptions } = queryConfig
       const queryKey = (resolvedOptions && 'queryKey' in resolvedOptions ? toValue(resolvedOptions.queryKey) : undefined) ?? ${queryKeyName}(${queryKeyParamsCall})

       const query = useInfiniteQuery({
        ...${queryOptionsName}(${queryOptionsParamsCall}),
        ...resolvedOptions,
        queryKey
       } as unknown as UseInfiniteQueryOptions<${TData}, ${TError}, ${TData}, TQueryKey, ${TData}>, toValue(queryClient)) as ${returnType}

       query.queryKey = queryKey as TQueryKey

       return query
       `}
      </Function>
    </File.Source>
  )
}

InfiniteQuery.getParams = getParams
