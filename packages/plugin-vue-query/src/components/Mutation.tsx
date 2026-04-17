import { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginVueQuery } from '../types.ts'
import { buildMutationArgParams, getComments, resolveErrorNames } from '../utils.ts'
import { MutationKey } from './MutationKey.tsx'

type Props = {
  name: string
  typeName: string
  clientName: string
  mutationKeyName: string
  node: ast.OperationNode
  tsResolver: PluginTs['resolver']
  paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginVueQuery['resolvedOptions']['paramsType']
  dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
  pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })
const keysPrinter = functionPrinter({ mode: 'keys' })

function getParams(
  node: ast.OperationNode,
  options: {
    paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
    dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
    resolver: PluginTs['resolver']
  },
): ast.FunctionParametersNode {
  const { paramsCasing, dataReturnType, resolver } = options
  const responseName = resolver.resolveResponseName(node)
  const requestName = node.requestBody?.schema ? resolver.resolveDataName(node) : undefined
  const errorNames = resolveErrorNames(node, resolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const mutationArgParamsNode = buildMutationArgParams(node, { paramsCasing, resolver })

  // Vue-query uses MutationObserverOptions instead of UseMutationOptions, and wraps params with MaybeRefOrGetter
  const mutationArgWrapped = mutationArgParamsNode.params.map((param) => {
    const fp = param as ast.FunctionParameterNode
    return {
      ...fp,
      type: fp.type ? ast.createParamsType({ variant: 'reference', name: `MaybeRefOrGetter<${printType(fp.type)}>` }) : fp.type,
    }
  })
  const wrappedParamsNode = ast.createFunctionParameters({ params: mutationArgWrapped })
  const TRequestWrapped = wrappedParamsNode.params.length > 0 ? (declarationPrinter.print(wrappedParamsNode) ?? '') : ''

  return ast.createFunctionParameters({
    params: [
      ast.createFunctionParameter({
        name: 'options',
        type: ast.createParamsType({
          variant: 'reference',
          name: `{
  mutation?: MutationObserverOptions<${[TData, TError, TRequestWrapped ? `{${TRequestWrapped}}` : 'void', 'TContext'].join(', ')}> & { client?: QueryClient },
  client?: ${requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }'},
}`,
        }),
        default: '{}',
      }),
    ],
  })
}

function printType(typeNode: ast.ParamsTypeNode | undefined): string {
  if (!typeNode) return 'unknown'
  if (typeNode.variant === 'reference') return typeNode.name
  if (typeNode.variant === 'member') return `${typeNode.base}['${typeNode.key}']`
  return 'unknown'
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

  const mutationArgParamsNode = buildMutationArgParams(node, { paramsCasing, resolver: tsResolver })
  const hasMutationParams = mutationArgParamsNode.params.length > 0
  const TRequest = hasMutationParams ? (declarationPrinter.print(mutationArgParamsNode) ?? '') : ''
  const argKeysStr = hasMutationParams ? (keysPrinter.print(mutationArgParamsNode) ?? '') : ''

  const generics = [TData, TError, TRequest ? `{${TRequest}}` : 'void', 'TContext'].join(', ')

  const mutationKeyParamsNode = MutationKey.getParams()
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
          name: node.requestBody?.schema
            ? `Partial<RequestConfig<${tsResolver.resolveDataName(node)}>> & { client?: Client }`
            : 'Partial<RequestConfig> & { client?: Client }',
        }),
        default: '{}',
      }),
    ],
  })
  const clientCallStr = callPrinter.print(clientCallParamsNode) ?? ''

  const paramsNode = getParams(node, { paramsCasing, dataReturnType, resolver: tsResolver })
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

Mutation.getParams = getParams
