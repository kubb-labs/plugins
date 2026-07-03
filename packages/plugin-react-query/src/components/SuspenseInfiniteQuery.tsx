import { getOperationParameters } from '@internals/shared'
import type { ast } from 'kubb/kit'
import type { FunctionParameterNode, FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import { buildGroupedRequestParam } from '@internals/tanstack-query'
import type { Infinite, PluginReactQuery } from '../types.ts'
import { buildClientOptionType, buildResolvedRequestParams, getComments, maybeValueOrGetter, resolveErrorNames, resolveSuccessNames } from '../utils.ts'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  customOptions: PluginReactQuery['resolvedOptions']['customOptions']
  initialPageParam: Infinite['initialPageParam']
  queryParam?: Infinite['queryParam']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

function buildSuspenseInfiniteQueryParamsNode(
  node: ast.OperationNode,
  options: {
    resolver: ResolverTs
    pageParamGeneric: string
  },
): FunctionParametersNode {
  const { resolver, pageParamGeneric } = options

  const optionsParam = createFunctionParameter({
    name: 'options',
    type: `{
  query?: Partial<UseSuspenseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, ${pageParamGeneric}>> & { client?: QueryClient },
  client?: ${buildClientOptionType()}
}`,
    default: '{}',
  })

  const groupedParam = buildGroupedRequestParam(node, { resolver, memberTypeWrapper: maybeValueOrGetter })

  return createFunctionParameters({ params: [groupedParam, optionsParam].filter((param): param is FunctionParameterNode => param !== null) })
}

export function SuspenseInfiniteQuery({
  name,
  queryKeyTypeName,
  queryOptionsName,
  queryKeyName,
  node,
  tsResolver,
  customOptions,
  initialPageParam,
  queryParam,
}: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const responseType = responseName
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

  const rawQueryParams = getOperationParameters(node, { paramsCasing: 'original' }).query
  const queryParamsTypeName =
    rawQueryParams.length > 0
      ? (() => {
          const groupName = tsResolver.resolveQueryParamsName(node, rawQueryParams[0]!)
          const individualName = tsResolver.resolveParamName(node, rawQueryParams[0]!)
          return groupName !== individualName ? groupName : null
        })()
      : null

  const queryParamType = queryParam && queryParamsTypeName ? `${queryParamsTypeName}['${queryParam}']` : null
  const pageParamType = queryParamType ? (isInitialPageParamDefined ? `NonNullable<${queryParamType}>` : queryParamType) : fallbackPageParamType

  const returnType = 'UseSuspenseInfiniteQueryResult<TData, TError> & { queryKey: TQueryKey }'
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

  const paramsNode = buildSuspenseInfiniteQueryParamsNode(node, {
    resolver: tsResolver,
    pageParamGeneric: 'TPageParam',
  })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export generics={generics.join(', ')} params={paramsSignature} returnType={undefined} JSDoc={{ comments: getComments(node) }}>
        {`
       const { query: queryConfig = {}, client: config = {} } = options ?? {}
       const { client: queryClient, ...resolvedOptions } = queryConfig${resolvedParams ? `\n       const resolvedParams = ${resolvedParams}` : ''}
       const queryKey = resolvedOptions?.queryKey ?? ${queryKeyName}(${queryKeyArgs})${customOptions ? `\n       const customOptions = ${customOptions.name}({ hookName: '${name}', operationId: '${node.operationId}' })` : ''}

       const queryResult = useSuspenseInfiniteQuery({
        ...${queryOptionsName}(${queryOptionsArgs}),${customOptions ? '\n        ...customOptions,' : ''}
        ...resolvedOptions,
        queryKey,
       } as unknown as UseSuspenseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, queryClient) as ${returnType}

       queryResult.queryKey = queryKey as TQueryKey

       return queryResult
       `}
      </Function>
    </File.Source>
  )
}
