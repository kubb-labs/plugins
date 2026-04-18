import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginReactQuery } from '../types.ts'
import { buildMutationArgParams, resolveErrorNames } from '../utils.ts'

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
const keysPrinter = functionPrinter({ mode: 'keys' })

function getConfigParam(node: ast.OperationNode, resolver: ResolverTs): ast.FunctionParametersNode {
  const requestName = node.requestBody?.schema ? resolver.resolveDataName(node) : undefined
  return ast.createFunctionParameters({
    params: [
      ast.createFunctionParameter({
        name: 'config',
        type: ast.createParamsType({
          variant: 'reference',
          name: requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }',
        }),
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
  const responseName = tsResolver.resolveResponseName(node)
  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const errorNames = resolveErrorNames(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const configParamsNode = getConfigParam(node, tsResolver)
  const paramsSignature = declarationPrinter.print(configParamsNode) ?? ''

  const mutationArgParamsNode = buildMutationArgParams(node, { paramsCasing, resolver: tsResolver })
  const hasMutationParams = mutationArgParamsNode.params.length > 0

  const TRequest = hasMutationParams ? (declarationPrinter.print(mutationArgParamsNode) ?? '') : ''
  const argKeysStr = hasMutationParams ? (keysPrinter.print(mutationArgParamsNode) ?? '') : ''

  const clientCallParamsNode = ast.createOperationParams(node, {
    paramsType,
    pathParamsType: paramsType === 'object' ? 'object' : pathParamsType === 'object' ? 'object' : 'inline',
    paramsCasing,
    resolver: tsResolver,
    extraParams: [
      ast.createFunctionParameter({
        name: 'config',
        type: ast.createParamsType({
          variant: 'reference',
          name: node.requestBody?.schema
            ? `Partial<RequestConfig<${tsResolver.resolveDataName(node)}>> & { client?: Client }`
            : 'Partial<RequestConfig> & { client?: Client }',
        }),
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
      return mutationOptions<${TData}, ${TError}, ${TRequest ? `{${TRequest}}` : 'void'}, TContext>({
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

MutationOptions.getParams = getConfigParam
