import type { ast } from '@kubb/core'
import type { FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildQueryOptionsParams } from '@internals/tanstack-query'
import type { PluginVueQuery } from '../types.ts'
import { buildStatusUnionType, buildVueClientCallArgs, buildVueSlimClientCall, maybeRefOrGetter, resolveErrorNames, resolveSuccessNames } from '../utils.ts'
import { buildQueryKeyParamsNode } from './QueryKey.tsx'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
  slim?: boolean
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function getQueryOptionsParams(node: ast.OperationNode, options: { resolver: ResolverTs; slim?: boolean }): FunctionParametersNode {
  return buildQueryOptionsParams(node, { resolver: options.resolver, memberTypeWrapper: maybeRefOrGetter, slim: options.slim })
}

export function QueryOptions({ name, clientName, dataReturnType, node, tsResolver, queryKeyName, slim = false }: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const queryKeyParamsNode = buildQueryKeyParamsNode(node, { resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const paramsNode = getQueryOptionsParams(node, { resolver: tsResolver, slim })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const clientCallArgs = buildVueClientCallArgs(node)
  const queryFnBody = slim
    ? `const { data } = await ${buildVueSlimClientCall(node, { clientName, signal: true })}
          return data`
    : `return ${clientName}(${clientCallArgs})`

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
