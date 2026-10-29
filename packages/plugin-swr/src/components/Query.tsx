import type { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildHookParams, buildQueryKeyParams, buildQueryOptionsParams, buildResponseTypes } from '@internals/tanstack-query'
import { buildClientOptionType, buildOperationComments as getComments } from '@internals/shared'

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

export function Query({ name, queryKeyTypeName, queryOptionsName, queryKeyName, node, tsResolver }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver)
  const generics = [TData, TError, `${queryKeyTypeName} | null`]

  const queryKeyParamsNode = buildQueryKeyParams(node, { resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const queryOptionsParamsNode = buildQueryOptionsParams(node, { resolver: tsResolver })
  const queryOptionsParamsCall = callPrinter.print(queryOptionsParamsNode) ?? ''

  const paramsNode = buildHookParams(node, {
    resolver: tsResolver,
    optionsType: `{
  query?: SWRConfiguration<${[TData, TError].join(', ')}>,
  client?: ${buildClientOptionType()},
  shouldFetch?: boolean,
  immutable?: boolean
}`,
  })
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
