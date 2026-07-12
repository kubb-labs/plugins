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
  /**
   * Emits the `useSuspenseQuery` variant of the hook instead of `useQuery`. The suspense observer
   * options drop the `TQueryData` generic, everything else stays identical.
   */
  suspense?: boolean
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

function buildQueryParamsNode(
  node: ast.OperationNode,
  options: {
    resolver: ResolverTs
    suspense?: boolean
  },
): FunctionParametersNode {
  const { resolver, suspense } = options
  const { TData, TError } = buildResponseTypes(node, resolver)

  const observerOptionsType = suspense
    ? `UseSuspenseQueryOptions<${[TData, TError, 'TData', 'TQueryKey'].join(', ')}>`
    : `QueryObserverOptions<${[TData, TError, 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>`

  const optionsParam = createFunctionParameter({
    name: 'options',
    type: `{
  query?: Partial<${observerOptionsType}> & { client?: QueryClient },
  client?: ${buildClientOptionType()}
}`,
    default: '{}',
  })

  const groupedParam = buildGroupedRequestParam(node, { resolver, memberTypeWrapper: maybeValueOrGetter })

  return createFunctionParameters({ params: [groupedParam, optionsParam].filter((param): param is FunctionParameterNode => param !== null) })
}

export function Query({ name, queryKeyTypeName, queryOptionsName, queryKeyName, node, tsResolver, customOptions, suspense }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver)
  const hookName = suspense ? 'useSuspenseQuery' : 'useQuery'
  const observerOptionsName = suspense ? 'UseSuspenseQueryOptions' : 'QueryObserverOptions'
  const resultTypeName = suspense ? 'UseSuspenseQueryResult' : 'UseQueryResult'
  const returnType = `${resultTypeName}<TData, ${TError}> & { queryKey: TQueryKey }`
  const generics = suspense
    ? [`TData = ${TData}`, `TQueryKey extends QueryKey = ${queryKeyTypeName}`]
    : [`TData = ${TData}`, `TQueryData = ${TData}`, `TQueryKey extends QueryKey = ${queryKeyTypeName}`]

  const resolvedParams = buildResolvedRequestParams(node)
  const queryKeyArgs = resolvedParams ? 'resolvedParams' : ''
  const queryOptionsArgs = resolvedParams ? 'resolvedParams, config' : 'config'

  const paramsNode = buildQueryParamsNode(node, { resolver: tsResolver, suspense })
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
       } as unknown as ${observerOptionsName}, queryClient) as ${returnType}

       queryResult.queryKey = queryKey as TQueryKey

       return queryResult
       `}
      </Function>
    </File.Source>
  )
}
