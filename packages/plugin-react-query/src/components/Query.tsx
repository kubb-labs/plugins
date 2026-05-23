import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginReactQuery } from '../types.ts'
import { buildQueryKeyParams, getComments, resolveErrorNames, resolveRequestTypeName, resolveSuccessNames } from '../utils.ts'
import { getQueryOptionsParams } from './QueryOptions.tsx'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginReactQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  operationTypes: PluginReactQuery['resolvedOptions']['client']['operationTypes']
  customOptions: PluginReactQuery['resolvedOptions']['customOptions']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function buildQueryParamsNode(
  node: ast.OperationNode,
  options: {
    paramsType: PluginReactQuery['resolvedOptions']['paramsType']
    paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
    pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
    dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
    operationTypes: PluginReactQuery['resolvedOptions']['client']['operationTypes']
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  const { paramsType, paramsCasing, pathParamsType, dataReturnType, operationTypes, resolver } = options
  const successNames = resolveSuccessNames(node, resolver, { operationTypes })
  const responseName = successNames.length > 0 ? successNames.join(' | ') : resolver.resolveResponseName(node)
  const requestName = resolveRequestTypeName({ node, resolver, operationTypes })
  const errorNames = resolveErrorNames(node, resolver, { operationTypes })

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const optionsParam = ast.createFunctionParameter({
    name: 'options',
    type: ast.createParamsType({
      variant: 'reference',
      name: `{
  query?: Partial<QueryObserverOptions<${[TData, TError, 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>> & { client?: QueryClient },
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

export function Query({
  name,
  queryKeyTypeName,
  queryOptionsName,
  queryKeyName,
  paramsType,
  paramsCasing,
  pathParamsType,
  dataReturnType,
  operationTypes,
  node,
  tsResolver,
  customOptions,
}: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver, { operationTypes })
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver, { operationTypes })

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`
  const returnType = `UseQueryResult<${'TData'}, ${TError}> & { queryKey: TQueryKey }`
  const generics = [`TData = ${TData}`, `TQueryData = ${TData}`, `TQueryKey extends QueryKey = ${queryKeyTypeName}`]

  const queryKeyParamsNode = buildQueryKeyParams(node, { pathParamsType, paramsCasing, resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const queryOptionsParamsNode = getQueryOptionsParams(node, { paramsType, paramsCasing, pathParamsType, operationTypes, resolver: tsResolver })
  const queryOptionsParamsCall = callPrinter.print(queryOptionsParamsNode) ?? ''

  const paramsNode = buildQueryParamsNode(node, { paramsType, paramsCasing, pathParamsType, dataReturnType, operationTypes, resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export generics={generics.join(', ')} params={paramsSignature} returnType={undefined} JSDoc={{ comments: getComments(node) }}>
        {`
       const { query: queryConfig = {}, client: config = {} } = options ?? {}
       const { client: queryClient, ...resolvedOptions } = queryConfig
       const queryKey = resolvedOptions?.queryKey ?? ${queryKeyName}(${queryKeyParamsCall})
       ${customOptions ? `const customOptions = ${customOptions.name}({ hookName: '${name}', operationId: '${node.operationId}' })` : ''}

       const query = useQuery({
        ...${queryOptionsName}(${queryOptionsParamsCall}),${customOptions ? '\n...customOptions,' : ''}
        ...resolvedOptions,
        queryKey,
       } as unknown as QueryObserverOptions, queryClient) as ${returnType}

       query.queryKey = queryKey as TQueryKey

       return query
       `}
      </Function>
    </File.Source>
  )
}
