import type { ast } from 'kubb/kit'
import type { FunctionParameterNode, FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { PluginReactQuery } from '../types.ts'
import { buildGroupedRequestParam } from '@internals/tanstack-query'
import { buildClientOptionType, buildResolvedRequestParams, buildResponseTypes, getComments, maybeValueOrGetter } from '../utils.ts'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  customOptions: PluginReactQuery['resolvedOptions']['customOptions']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

function buildQueryParamsNode(
  node: ast.OperationNode,
  options: {
    resolver: ResolverTs
  },
): FunctionParametersNode {
  const { resolver } = options
  const { TData, TError } = buildResponseTypes(node, resolver)

  const optionsParam = createFunctionParameter({
    name: 'options',
    type: `{
  query?: Partial<QueryObserverOptions<${[TData, TError, 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>> & { client?: QueryClient },
  client?: ${buildClientOptionType()}
}`,
    default: '{}',
  })

  const groupedParam = buildGroupedRequestParam(node, { resolver, memberTypeWrapper: maybeValueOrGetter })

  return createFunctionParameters({ params: [groupedParam, optionsParam].filter((param): param is FunctionParameterNode => param !== null) })
}

export function Query({ name, queryKeyTypeName, queryOptionsName, queryKeyName, node, tsResolver, customOptions }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver)
  const returnType = `UseQueryResult<${'TData'}, ${TError}> & { queryKey: TQueryKey }`
  const generics = [`TData = ${TData}`, `TQueryData = ${TData}`, `TQueryKey extends QueryKey = ${queryKeyTypeName}`]

  const resolvedParams = buildResolvedRequestParams(node)
  const queryKeyArgs = resolvedParams ? 'resolvedParams' : ''
  const queryOptionsArgs = resolvedParams ? 'resolvedParams, config' : 'config'

  const paramsNode = buildQueryParamsNode(node, { resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export generics={generics.join(', ')} params={paramsSignature} returnType={undefined} JSDoc={{ comments: getComments(node) }}>
        {`
       const { query: queryConfig = {}, client: config = {} } = options ?? {}
       const { client: queryClient, ...resolvedOptions } = queryConfig${resolvedParams ? `\n       const resolvedParams = ${resolvedParams}` : ''}
       const queryKey = resolvedOptions?.queryKey ?? ${queryKeyName}(${queryKeyArgs})${customOptions ? `\n       const customOptions = ${customOptions.name}({ hookName: '${name}', operationId: '${node.operationId}' })` : ''}

       const queryResult = useQuery({
        ...${queryOptionsName}(${queryOptionsArgs}),${customOptions ? '\n        ...customOptions,' : ''}
        ...resolvedOptions,
        queryKey,
       } as unknown as QueryObserverOptions, queryClient) as ${returnType}

       queryResult.queryKey = queryKey as TQueryKey

       return queryResult
       `}
      </Function>
    </File.Source>
  )
}
