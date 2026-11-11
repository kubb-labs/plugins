import type { ast } from '@kubb/kit'
import type { FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildCallResultBody, buildClientCall, buildQueryKeyParams, buildQueryOptionsParams, buildResponseTypes } from '@internals/tanstack-query'
import type { CallReturnTypeProps } from '@internals/tanstack-query'
import { maybeRefOrGetter } from '../utils.ts'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
} & CallReturnTypeProps

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function getQueryOptionsParams(node: ast.OperationNode, options: { resolver: ResolverTs }): FunctionParametersNode {
  return buildQueryOptionsParams(node, { resolver: options.resolver, memberTypeWrapper: maybeRefOrGetter })
}

export function QueryOptions({ name, clientName, node, tsResolver, queryKeyName, clientReturnType, returnType, typedHeaders }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver, { returnType, typedHeaders })

  const queryKeyParamsNode = buildQueryKeyParams(node, { resolver: tsResolver, memberTypeWrapper: maybeRefOrGetter })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const paramsNode = getQueryOptionsParams(node, { resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const queryFnBody = buildCallResultBody(buildClientCall(node, { clientName, signal: true, unwrapName: (name) => `toValue(${name})` }), {
    clientReturnType,
    returnType,
  })

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature}>
        {`
      const queryKey = ${queryKeyName}(${queryKeyParamsCall})
      return queryOptions<${TData}, ${TError}, ${TData}>({
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
