import { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { Infinite, PluginReactQuery } from '../types.ts'
import { getComments, resolveErrorNames } from '../utils.ts'
import { QueryKey } from './QueryKey.tsx'
import { getQueryOptionsParams } from './QueryOptions.tsx'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: PluginTs['resolver']
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginReactQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  initialPageParam: Infinite['initialPageParam']
  queryParam?: Infinite['queryParam']
  customOptions: PluginReactQuery['resolvedOptions']['customOptions']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function getParams(
  node: ast.OperationNode,
  options: {
    paramsType: PluginReactQuery['resolvedOptions']['paramsType']
    paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
    pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
    dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
    resolver: PluginTs['resolver']
    pageParamGeneric: string
  },
): ast.FunctionParametersNode {
  const { paramsType, paramsCasing, pathParamsType, resolver, pageParamGeneric } = options
  const requestName = node.requestBody?.schema ? resolver.resolveDataName(node) : undefined

  const optionsParam = ast.createFunctionParameter({
    name: 'options',
    type: ast.createParamsType({
      variant: 'reference',
      name: `{
  query?: Partial<InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, ${pageParamGeneric}>> & { client?: QueryClient },
  client?: ${requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }'}
}`,
    }),
    default: '{}',
  })

  return ast.createOperationParams(node, {
    paramsType,
    pathParamsType: paramsType === 'object' ? 'object' : pathParamsType === 'object' ? 'object' : 'inline',
    paramsCasing,
    resolver,
    extraParams: [optionsParam],
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
  initialPageParam,
  queryParam,
  customOptions,
}: Props): KubbReactNode {
  const responseName = tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const responseType = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const errorType = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const isInitialPageParamDefined = initialPageParam !== undefined && initialPageParam !== null
  const fallbackPageParamType =
    typeof initialPageParam === 'number'
      ? 'number'
      : typeof initialPageParam === 'string'
        ? initialPageParam.includes(' as ')
          ? (() => {
              const parts = initialPageParam.split(' as ')
              return parts[parts.length - 1] ?? 'unknown'
            })()
          : 'string'
        : typeof initialPageParam === 'boolean'
          ? 'boolean'
          : 'unknown'

  const rawQueryParams = node.parameters.filter((p) => p.in === 'query')
  const queryParamsTypeName =
    rawQueryParams.length > 0
      ? (() => {
          const groupName = tsResolver.resolveQueryParamsName(node, rawQueryParams[0]!)
          const individualName = tsResolver.resolveParamName(node, rawQueryParams[0]!)
          return groupName !== individualName ? groupName : undefined
        })()
      : undefined

  const queryParamType = queryParam && queryParamsTypeName ? `${queryParamsTypeName}['${queryParam}']` : undefined
  const pageParamType = queryParamType ? (isInitialPageParamDefined ? `NonNullable<${queryParamType}>` : queryParamType) : fallbackPageParamType

  const returnType = 'UseInfiniteQueryResult<TData, TError> & { queryKey: TQueryKey }'
  const generics = [
    `TQueryFnData = ${responseType}`,
    `TError = ${errorType}`,
    'TData = InfiniteData<TQueryFnData>',
    `TQueryKey extends QueryKey = ${queryKeyTypeName}`,
    `TPageParam = ${pageParamType}`,
  ]

  const queryKeyParamsNode = QueryKey.getParams(node, { pathParamsType, paramsCasing, resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const queryOptionsParamsNode = getQueryOptionsParams(node, { paramsType, paramsCasing, pathParamsType, resolver: tsResolver })
  const queryOptionsParamsCall = callPrinter.print(queryOptionsParamsNode) ?? ''

  const paramsNode = getParams(node, { paramsType, paramsCasing, pathParamsType, dataReturnType, resolver: tsResolver, pageParamGeneric: 'TPageParam' })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export generics={generics.join(', ')} params={paramsSignature} returnType={undefined} JSDoc={{ comments: getComments(node) }}>
        {`
       const { query: queryConfig = {}, client: config = {} } = options ?? {}
       const { client: queryClient, ...resolvedOptions } = queryConfig
       const queryKey = resolvedOptions?.queryKey ?? ${queryKeyName}(${queryKeyParamsCall})
       ${customOptions ? `const customOptions = ${customOptions.name}({ hookName: '${name}', operationId: '${node.operationId}' })` : ''}

       const query = useInfiniteQuery({
        ...${queryOptionsName}(${queryOptionsParamsCall}),${customOptions ? '\n...customOptions,' : ''}
        ...resolvedOptions,
        queryKey,
       } as unknown as InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, queryClient) as ${returnType}

       query.queryKey = queryKey as TQueryKey

       return query
       `}
      </Function>
    </File.Source>
  )
}

InfiniteQuery.getParams = getParams
