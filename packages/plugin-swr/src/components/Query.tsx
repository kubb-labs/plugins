import type { ast } from 'kubb/kit'
import type { FunctionParameterNode, FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import { buildGroupedRequestParam, buildQueryOptionsParams } from '@internals/tanstack-query'
import { buildClientOptionType, buildQueryKeyParams, getComments, resolveErrorNames } from '../utils.ts'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function buildQueryParamsNode(
  node: ast.OperationNode,
  options: {
    resolver: ResolverTs
  },
): FunctionParametersNode {
  const { resolver } = options
  const responseName = resolver.response.response(node)
  const errorNames = resolveErrorNames(node, resolver)

  const TData = responseName
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const optionsParam = createFunctionParameter({
    name: 'options',
    type: `{
  query?: SWRConfiguration<${[TData, TError].join(', ')}>,
  client?: ${buildClientOptionType()},
  shouldFetch?: boolean,
  immutable?: boolean
}`,
    default: '{}',
  })

  const groupedParam = buildGroupedRequestParam(node, { resolver })

  return createFunctionParameters({ params: [groupedParam, optionsParam].filter((param): param is FunctionParameterNode => param !== null) })
}

export function Query({ name, queryKeyTypeName, queryOptionsName, queryKeyName, node, tsResolver }: Props): KubbReactNode {
  const responseName = tsResolver.response.response(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = responseName
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`
  const generics = [TData, TError, `${queryKeyTypeName} | null`]

  const queryKeyParamsNode = buildQueryKeyParams(node, { resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const queryOptionsParamsNode = buildQueryOptionsParams(node, { resolver: tsResolver })
  const queryOptionsParamsCall = callPrinter.print(queryOptionsParamsNode) ?? ''

  const paramsNode = buildQueryParamsNode(node, { resolver: tsResolver })
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
