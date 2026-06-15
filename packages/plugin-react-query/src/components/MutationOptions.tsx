import { ast } from '@kubb/core'
import { createOperationParams } from '@kubb/ast/utils'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginReactQuery } from '../types.ts'
import { buildRequestConfigType, buildStatusUnionType, resolveErrorNames, resolveSuccessNames } from '../utils.ts'

type Props = {
  name: string
  clientName: string
  mutationKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginReactQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })
const keysPrinter = functionPrinter({ mode: 'call' })

export function buildMutationConfigParamsNode(node: ast.OperationNode, resolver: ResolverTs): ast.FunctionParametersNode {
  return ast.factory.createFunctionParameters({
    params: [
      ast.factory.createFunctionParameter({
        name: 'config',
        type: buildRequestConfigType(node, resolver),
        default: '{}',
      }),
    ],
  })
}

export function MutationOptions({
  name,
  clientName,
  dataReturnType,
  node,
  tsResolver,
  paramsCasing,
  paramsType,
  pathParamsType,
  mutationKeyName,
}: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, tsResolver)
  const errorNames = resolveErrorNames(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const configParamsNode = buildMutationConfigParamsNode(node, tsResolver)
  const paramsSignature = declarationPrinter.print(configParamsNode) ?? ''

  const mutationArgParamsNode = createOperationParams(node, {
    paramsType: 'inline',
    pathParamsType: 'inline',
    paramsCasing,
    resolver: tsResolver,
  })
  const hasMutationParams = mutationArgParamsNode.params.length > 0

  const TRequest = hasMutationParams ? (declarationPrinter.print(mutationArgParamsNode) ?? '') : ''
  const argKeysStr = hasMutationParams ? (keysPrinter.print(mutationArgParamsNode) ?? '') : ''

  const clientCallParamsNode = createOperationParams(node, {
    paramsType,
    pathParamsType: paramsType === 'object' ? 'object' : pathParamsType === 'object' ? 'object' : 'inline',
    paramsCasing,
    resolver: tsResolver,
    extraParams: [
      ast.factory.createFunctionParameter({
        name: 'config',
        type: buildRequestConfigType(node, tsResolver),
        default: '{}',
      }),
    ],
  })
  const clientCallStr = callPrinter.print(clientCallParamsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature} generics={['TContext = unknown']}>
        {`
      const mutationKey = ${mutationKeyName}()
      return mutationOptions<${TData}, ${TError}, ${TRequest ? `{${TRequest}}` : 'undefined'}, TContext>({
        mutationKey,
        mutationFn: async(${hasMutationParams ? `{ ${argKeysStr} }` : '_'}) => {
          return ${clientName}(${clientCallStr})
        },
      })
`}
      </Function>
    </File.Source>
  )
}
