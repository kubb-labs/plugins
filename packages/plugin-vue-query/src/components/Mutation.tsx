import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildGroupedRequestParam, buildSlimClientCall } from '@internals/tanstack-query'
import type { PluginVueQuery } from '../types.ts'
import { buildRequestConfigType, buildStatusUnionType, getComments, resolveErrorNames, resolveSuccessNames } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  clientName: string
  mutationKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
  slim?: boolean
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function resolveMutationRequestType(node: ast.OperationNode, resolver: ResolverTs): string {
  const groupedParam = buildGroupedRequestParam(node, { resolver })
  return groupedParam ? resolver.resolveRequestConfigName(node) : 'undefined'
}

function buildMutationParamsNode(
  node: ast.OperationNode,
  options: {
    dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
    resolver: ResolverTs
    slim?: boolean
  },
): ast.FunctionParametersNode {
  const { dataReturnType, resolver, slim } = options
  const successNames = resolveSuccessNames(node, resolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : resolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, resolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, resolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const TRequest = resolveMutationRequestType(node, resolver)

  return ast.factory.createFunctionParameters({
    params: [
      ast.factory.createFunctionParameter({
        name: 'options',
        type: `{
  mutation?: MutationObserverOptions<${[TData, TError, TRequest, 'TContext'].join(', ')}> & { client?: QueryClient },
  client?: ${buildRequestConfigType(node, resolver, { slim })},
}`,
        default: '{}',
      }),
    ],
  })
}

export function Mutation({ name, clientName, dataReturnType, node, tsResolver, mutationKeyName, slim = false }: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const groupedParam = buildGroupedRequestParam(node, { resolver: tsResolver })
  const hasMutationParams = groupedParam !== null
  const groupedParamsNode = ast.factory.createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
  const argBindingStr = hasMutationParams ? (callPrinter.print(groupedParamsNode) ?? '') : ''
  const clientCallStr = [hasMutationParams ? argBindingStr : null, 'config'].filter(Boolean).join(', ')
  const mutationFnBody = slim
    ? `const { data } = await ${buildSlimClientCall(node, { clientName, signal: false })}
            return data`
    : `return ${clientName}(${clientCallStr})`

  const TRequest = resolveMutationRequestType(node, tsResolver)
  const generics = [TData, TError, TRequest, 'TContext'].join(', ')

  const mutationKeyParamsNode = ast.factory.createFunctionParameters({ params: [] })
  const mutationKeyParamsCall = callPrinter.print(mutationKeyParamsNode) ?? ''

  const paramsNode = buildMutationParamsNode(node, { dataReturnType, resolver: tsResolver, slim })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature} JSDoc={{ comments: getComments(node) }} generics={['TContext']}>
        {`
        const { mutation = {}, client: config = {} } = options ?? {}
        const { client: queryClient, ...mutationOptions } = mutation;
        const mutationKey = mutationOptions?.mutationKey ?? ${mutationKeyName}(${mutationKeyParamsCall})

        return useMutation<${generics}>({
          mutationFn: async(${hasMutationParams ? argBindingStr : ''}) => {
            ${mutationFnBody}
          },
          mutationKey,
          ...mutationOptions
        }, queryClient)
    `}
      </Function>
    </File.Source>
  )
}
