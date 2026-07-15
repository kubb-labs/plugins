import type { ast } from 'kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import { buildQueryOptionsParams, buildClientCall } from '@internals/tanstack-query'
import { buildQueryKeyParams, buildResponseTypes } from '../utils.ts'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function QueryOptions({ name, clientName, node, tsResolver, queryKeyName }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver)

  const queryKeyParamsNode = buildQueryKeyParams(node, { resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const paramsNode = buildQueryOptionsParams(node, { resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const queryFnBody = `const { data } = await ${buildClientCall(node, { clientName, signal: true })}
          return data`

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
