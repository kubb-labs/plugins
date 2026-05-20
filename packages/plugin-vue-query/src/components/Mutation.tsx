import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginVueQuery } from '../types.ts'
import { buildRequestConfigType, getComments, resolveErrorNames, wrapWithMaybeRefOrGetter } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  clientName: string
  mutationKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginVueQuery['resolvedOptions']['paramsType']
  dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
  pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })
const keysPrinter = functionPrinter({ mode: 'keys' })

function createMutationArgParams(
  node: ast.OperationNode,
  options: {
    paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  return ast.createOperationParams(node, {
    paramsType: 'inline',
    pathParamsType: 'inline',
    paramsCasing: options.paramsCasing,
    resolver: options.resolver,
  })
}

function buildMutationParamsNode(
  node: ast.OperationNode,
  options: {
    paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
    dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  const { paramsCasing, dataReturnType, resolver } = options
  const responseName = resolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, resolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const mutationArgParamsNode = createMutationArgParams(node, { paramsCasing, resolver })

  const wrappedParamsNode = wrapWithMaybeRefOrGetter(mutationArgParamsNode)
  const TRequestWrapped = wrappedParamsNode.params.length > 0 ? (declarationPrinter.print(wrappedParamsNode) ?? '') : ''

  return ast.createFunctionParameters({
    params: [
      ast.createFunctionParameter({
        name: 'options',
        type: ast.createParamsType({
          variant: 'reference',
          name: `{
  mutation?: MutationObserverOptions<${[TData, TError, TRequestWrapped ? `{${TRequestWrapped}}` : 'undefined', 'TContext'].join(', ')}> & { client?: QueryClient },
  client?: ${buildRequestConfigType(node, resolver)},
}`,
        }),
        default: '{}',
      }),
    ],
  })
}

export function Mutation({
  name,
  clientName,
  paramsCasing,
  paramsType,
  pathParamsType,
  dataReturnType,
  node,
  tsResolver,
  mutationKeyName,
}: Props): KubbReactNode {
  const responseName = tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const mutationArgParamsNode = createMutationArgParams(node, {
    paramsCasing,
    resolver: tsResolver,
  })
  const hasMutationParams = mutationArgParamsNode.params.length > 0
  const TRequest = hasMutationParams ? (declarationPrinter.print(mutationArgParamsNode) ?? '') : ''
  const argKeysStr = hasMutationParams ? (keysPrinter.print(mutationArgParamsNode) ?? '') : ''

  const generics = [TData, TError, TRequest ? `{${TRequest}}` : 'undefined', 'TContext'].join(', ')

  const mutationKeyParamsNode = ast.createFunctionParameters({ params: [] })
  const mutationKeyParamsCall = callPrinter.print(mutationKeyParamsNode) ?? ''

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
          name: buildRequestConfigType(node, tsResolver),
        }),
        default: '{}',
      }),
    ],
  })
  const clientCallStr = callPrinter.print(clientCallParamsNode) ?? ''

  const paramsNode = buildMutationParamsNode(node, { paramsCasing, dataReturnType, resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature} JSDoc={{ comments: getComments(node) }} generics={['TContext']}>
        {`
        const { mutation = {}, client: config = {} } = options ?? {}
        const { client: queryClient, ...mutationOptions } = mutation;
        const mutationKey = mutationOptions?.mutationKey ?? ${mutationKeyName}(${mutationKeyParamsCall})

        return useMutation<${generics}>({
          mutationFn: async(${hasMutationParams ? `{ ${argKeysStr} }` : ''}) => {
            return ${clientName}(${clientCallStr})
          },
          mutationKey,
          ...mutationOptions
        }, queryClient)
    `}
      </Function>
    </File.Source>
  )
}
