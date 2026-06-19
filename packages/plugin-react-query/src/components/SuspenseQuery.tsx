import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildGroupedRequestParam } from '@internals/tanstack-query'
import type { PluginReactQuery } from '../types.ts'
import { buildQueryKeyParams, buildStatusUnionType, getComments, resolveErrorNames, resolveSuccessNames } from '../utils.ts'
import { getQueryOptionsParams } from './QueryOptions.tsx'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  customOptions: PluginReactQuery['resolvedOptions']['customOptions']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function buildSuspenseQueryParamsNode(
  node: ast.OperationNode,
  options: {
    dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
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
  query?: Partial<UseSuspenseQueryOptions<${[TData, TError, 'TData', 'TQueryKey'].join(', ')}>> & { client?: QueryClient },
  client?: ${requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }'}
}`,
    default: '{}',
  })

  const groupedParam = buildGroupedRequestParam(node, { resolver })

  return ast.factory.createFunctionParameters({ params: [groupedParam, optionsParam].filter((param): param is ast.FunctionParameterNode => param !== null) })
}

export function SuspenseQuery({
  name,
  queryKeyTypeName,
  queryOptionsName,
  queryKeyName,
  dataReturnType,
  node,
  tsResolver,
  customOptions,
}: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`
  const returnType = `UseSuspenseQueryResult<${'TData'}, ${TError}> & { queryKey: TQueryKey }`
  const generics = [`TData = ${TData}`, `TQueryKey extends QueryKey = ${queryKeyTypeName}`]

  const queryKeyParamsNode = buildQueryKeyParams(node, { resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const queryOptionsParamsNode = getQueryOptionsParams(node, { resolver: tsResolver })
  const queryOptionsParamsCall = callPrinter.print(queryOptionsParamsNode) ?? ''

  const paramsNode = buildSuspenseQueryParamsNode(node, { dataReturnType, resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export generics={generics.join(', ')} params={paramsSignature} returnType={undefined} JSDoc={{ comments: getComments(node) }}>
        {`
       const { query: queryConfig = {}, client: config = {} } = options ?? {}
       const { client: queryClient, ...resolvedOptions } = queryConfig
       const queryKey = resolvedOptions?.queryKey ?? ${queryKeyName}(${queryKeyParamsCall})${customOptions ? `\n       const customOptions = ${customOptions.name}({ hookName: '${name}', operationId: '${node.operationId}' })` : ''}

       const result = useSuspenseQuery({
        ...${queryOptionsName}(${queryOptionsParamsCall}),${customOptions ? '\n        ...customOptions,' : ''}
        ...resolvedOptions,
        queryKey,
       } as unknown as UseSuspenseQueryOptions, queryClient) as ${returnType}

       result.queryKey = queryKey as TQueryKey

       return result
       `}
      </Function>
    </File.Source>
  )
}
