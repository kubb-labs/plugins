import type { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildCallResultBody, buildQueryOptionsParams, buildClientCall } from '@internals/tanstack-query'
import type { ReturnTypeOption } from '@internals/client'
import { buildQueryKeyParams, buildResponseTypes } from '@internals/tanstack-query'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  /**
   * The registered client plugin's `returnType`, read by the caller off `resolveClientOperation`.
   *
   * @default 'full'
   */
  clientReturnType?: ReturnTypeOption
  returnType?: ReturnTypeOption
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function QueryOptions({ name, clientName, node, tsResolver, queryKeyName, clientReturnType = 'full', returnType = 'data' }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver, { returnType })

  const queryKeyParamsNode = buildQueryKeyParams(node, { resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const paramsNode = buildQueryOptionsParams(node, { resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const queryFnBody = buildCallResultBody(buildClientCall(node, { clientName, signal: true }), { clientReturnType, returnType })

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature}>
        {`
      const queryKey = ${queryKeyName}(${queryKeyParamsCall})
      return queryOptions<${TData}, ${TError}, ${TData}, typeof queryKey>({
       queryKey,
       queryFn: async ({ signal }) => {
          ${queryFnBody}
       },
      })
`}
      </Function>
    </File.Source>
  )
}
