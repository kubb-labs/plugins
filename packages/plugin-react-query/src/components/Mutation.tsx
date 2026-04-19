import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginReactQuery } from '../types.ts'
import { buildMutationArgParams, getComments, resolveErrorNames } from '../utils.ts'
import { MutationOptions } from './MutationOptions.tsx'

type Props = {
  name: string
  typeName: string
  mutationOptionsName: string
  mutationKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  customOptions: PluginReactQuery['resolvedOptions']['customOptions']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function getParams(
  node: ast.OperationNode,
  options: {
    paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
    dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  const { paramsCasing, dataReturnType, resolver } = options
  const responseName = resolver.resolveResponseName(node)
  const requestName = node.requestBody?.schema ? resolver.resolveDataName(node) : undefined
  const errorNames = resolveErrorNames(node, resolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const mutationArgParamsNode = buildMutationArgParams(node, { paramsCasing, resolver })
  const TRequest = mutationArgParamsNode.params.length > 0 ? (declarationPrinter.print(mutationArgParamsNode) ?? '') : ''
  const generics = [TData, TError, TRequest ? `{${TRequest}}` : 'void', 'TContext'].join(', ')

  return ast.createFunctionParameters({
    params: [
      ast.createFunctionParameter({
        name: 'options',
        type: ast.createParamsType({
          variant: 'reference',
          name: `{
  mutation?: UseMutationOptions<${generics}> & { client?: QueryClient },
  client?: ${requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }'},
}`,
        }),
        default: '{}',
      }),
    ],
  })
}

export function Mutation({ name, mutationOptionsName, paramsCasing, dataReturnType, node, tsResolver, mutationKeyName, customOptions }: Props): KubbReactNode {
  const responseName = tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const mutationArgParamsNode = buildMutationArgParams(node, { paramsCasing, resolver: tsResolver })
  const TRequest = mutationArgParamsNode.params.length > 0 ? (declarationPrinter.print(mutationArgParamsNode) ?? '') : ''
  const generics = [TData, TError, TRequest ? `{${TRequest}}` : 'void', 'TContext'].join(', ')
  const returnType = `UseMutationResult<${generics}>`

  const mutationOptionsConfigNode = MutationOptions.getParams(node, tsResolver)
  const mutationOptionsParamsCall = callPrinter.print(mutationOptionsConfigNode) ?? ''

  const paramsNode = getParams(node, { paramsCasing, dataReturnType, resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature} JSDoc={{ comments: getComments(node) }} generics={['TContext']}>
        {`
        const { mutation = {}, client: config = {} } = options ?? {}
        const { client: queryClient, ...mutationOptions } = mutation;
        const mutationKey = mutationOptions.mutationKey ?? ${mutationKeyName}()

        const baseOptions = ${mutationOptionsName}(${mutationOptionsParamsCall}) as UseMutationOptions<${generics}>
        ${customOptions ? `const customOptions = ${customOptions.name}({ hookName: '${name}', operationId: '${node.operationId}' }) as UseMutationOptions<${generics}>` : ''}

        return useMutation<${generics}>({
          ...baseOptions,${customOptions ? '\n...customOptions,' : ''}
          mutationKey,
          ...mutationOptions,
        }, queryClient) as ${returnType}
    `}
      </Function>
    </File.Source>
  )
}

Mutation.getParams = getParams
