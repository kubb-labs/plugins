import type { ast } from 'kubb/kit'
import type { FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import { buildGroupedRequestParam, buildResponseTypes } from '@internals/tanstack-query'
import { buildRequestConfigType, buildVueClientCall, getComments } from '../utils.ts'

type Props = {
  name: string
  typeName: string
  clientName: string
  mutationKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function resolveMutationRequestType(node: ast.OperationNode, resolver: ResolverTs): string {
  const groupedParam = buildGroupedRequestParam(node, { resolver })
  return groupedParam ? resolver.response.options(node) : 'undefined'
}

function buildMutationParamsNode(
  node: ast.OperationNode,
  options: {
    resolver: ResolverTs
  },
): FunctionParametersNode {
  const { resolver } = options
  const { TData, TError } = buildResponseTypes(node, resolver)

  const TRequest = resolveMutationRequestType(node, resolver)

  return createFunctionParameters({
    params: [
      createFunctionParameter({
        name: 'options',
        type: `{
  mutation?: MutationObserverOptions<${[TData, TError, TRequest, 'TContext'].join(', ')}> & { client?: QueryClient },
  client?: ${buildRequestConfigType(node)},
}`,
        default: '{}',
      }),
    ],
  })
}

export function Mutation({ name, clientName, node, tsResolver, mutationKeyName }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver)

  const groupedParam = buildGroupedRequestParam(node, { resolver: tsResolver })
  const hasMutationParams = groupedParam !== null
  const groupedParamsNode = createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
  const argBindingStr = hasMutationParams ? (callPrinter.print(groupedParamsNode) ?? '') : ''
  const mutationFnBody = `const { data } = await ${buildVueClientCall(node, { clientName, signal: false })}
            return data`

  const TRequest = resolveMutationRequestType(node, tsResolver)
  const generics = [TData, TError, TRequest, 'TContext'].join(', ')

  const paramsNode = buildMutationParamsNode(node, { resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature} JSDoc={{ comments: getComments(node) }} generics={['TContext']}>
        {`
        const { mutation = {}, client: config = {} } = options ?? {}
        const { client: queryClient, ...mutationOptions } = mutation;
        const mutationKey = mutationOptions?.mutationKey ?? ${mutationKeyName}()

        return useMutation<${generics}>({
          mutationFn: async(${argBindingStr}) => {
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
