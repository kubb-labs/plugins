import type { ast } from '@kubb/core'
import type { FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildGroupedRequestParam } from '@internals/tanstack-query'
import type { PluginReactQuery } from '../types.ts'
import { buildRequestConfigType, buildStatusUnionType, resolveErrorNames, resolveSuccessNames } from '../utils.ts'

type Props = {
  name: string
  clientName: string
  mutationKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function buildMutationConfigParamsNode(node: ast.OperationNode, resolver: ResolverTs): FunctionParametersNode {
  return createFunctionParameters({
    params: [
      createFunctionParameter({
        name: 'config',
        type: buildRequestConfigType(node, resolver),
        default: '{}',
      }),
    ],
  })
}

export function MutationOptions({ name, clientName, dataReturnType, node, tsResolver, mutationKeyName }: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, tsResolver)
  const errorNames = resolveErrorNames(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const configParamsNode = buildMutationConfigParamsNode(node, tsResolver)
  const paramsSignature = declarationPrinter.print(configParamsNode) ?? ''

  const groupedParam = buildGroupedRequestParam(node, { resolver: tsResolver })
  const hasMutationParams = groupedParam !== null

  const groupedParamsNode = createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
  const TRequest = hasMutationParams ? tsResolver.resolveRequestConfigName(node) : 'undefined'
  const argBindingStr = hasMutationParams ? (callPrinter.print(groupedParamsNode) ?? '') : '_'
  const clientCallStr = [hasMutationParams ? argBindingStr : null, 'config'].filter(Boolean).join(', ')

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature} generics={['TContext = unknown']}>
        {`
      const mutationKey = ${mutationKeyName}()
      return mutationOptions<${TData}, ${TError}, ${TRequest}, TContext>({
        mutationKey,
        mutationFn: async(${argBindingStr}) => {
          return ${clientName}(${clientCallStr})
        },
      })
`}
      </Function>
    </File.Source>
  )
}
