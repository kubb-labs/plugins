import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildGroupedRequestParam } from '@internals/tanstack-query'
import type { PluginSwr } from '../types.ts'
import { buildClientOptionType, buildQueryKeyParams, buildStatusUnionType, getComments, resolveErrorNames } from '../utils.ts'
import { getQueryOptionsParams } from './QueryOptions.tsx'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
  slim?: boolean
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function buildQueryParamsNode(
  node: ast.OperationNode,
  options: {
    dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
    resolver: ResolverTs
    slim?: boolean
  },
): ast.FunctionParametersNode {
  const { dataReturnType, resolver, slim = false } = options
  const responseName = resolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, resolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, resolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const optionsParam = ast.factory.createFunctionParameter({
    name: 'options',
    type: `{
  query?: SWRConfiguration<${[TData, TError].join(', ')}>,
  client?: ${buildClientOptionType(node, resolver, { slim })},
  shouldFetch?: boolean,
  immutable?: boolean
}`,
    default: '{}',
  })

  const groupedParam = buildGroupedRequestParam(node, { resolver })

  return ast.factory.createFunctionParameters({ params: [groupedParam, optionsParam].filter((param): param is ast.FunctionParameterNode => param !== null) })
}

export function Query({ name, queryKeyTypeName, queryOptionsName, queryKeyName, dataReturnType, node, tsResolver, slim = false }: Props): KubbReactNode {
  const responseName = tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`
  const generics = [TData, TError, `${queryKeyTypeName} | null`]

  const queryKeyParamsNode = buildQueryKeyParams(node, { resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const queryOptionsParamsNode = getQueryOptionsParams(node, { resolver: tsResolver, slim })
  const queryOptionsParamsCall = callPrinter.print(queryOptionsParamsNode) ?? ''

  const paramsNode = buildQueryParamsNode(node, { dataReturnType, resolver: tsResolver, slim })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature} JSDoc={{ comments: getComments(node) }}>
        {`
       const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

       const queryKey = ${queryKeyName}(${queryKeyParamsCall})

       return useSWR<${generics.join(', ')}>(
        shouldFetch ? queryKey : null,
        {
          ...${queryOptionsName}(${queryOptionsParamsCall}),
          ...(immutable ? {
              revalidateIfStale: false,
              revalidateOnFocus: false,
              revalidateOnReconnect: false
            } : { }),
          ...queryOptions,
        }
       )
       `}
      </Function>
    </File.Source>
  )
}
