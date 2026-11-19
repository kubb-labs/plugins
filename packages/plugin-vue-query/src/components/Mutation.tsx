import { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { Function, printParams } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import {
  buildCallResultBody,
  buildClientCall,
  buildGroupedRequestParam,
  buildHookParams,
  buildResponseTypes,
  resolveMutationRequestType,
} from '@internals/tanstack-query'
import type { CallReturnTypeProps } from '@internals/tanstack-query'
import type { ReturnTypeOption } from '@internals/client'
import { buildRequestConfigType, getComments } from '../utils.ts'

type Props = {
  name: string
  clientName: string
  mutationKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
} & CallReturnTypeProps

function buildMutationParamsNode(
  node: ast.OperationNode,
  options: { resolver: ResolverTs; returnType: ReturnTypeOption; typedHeaders?: boolean },
): ast.FunctionParametersNode {
  const { resolver, returnType, typedHeaders } = options
  const { TData, TError } = buildResponseTypes(node, resolver, { returnType, typedHeaders })

  return buildHookParams(node, {
    resolver,
    withRequest: false,
    optionsType: `{
  mutation?: MutationObserverOptions<${[TData, TError, resolveMutationRequestType(node, resolver), 'TContext'].join(', ')}> & { client?: QueryClient },
  client?: ${buildRequestConfigType(node)},
}`,
  })
}

export function Mutation({ name, clientName, node, tsResolver, mutationKeyName, clientReturnType, returnType, typedHeaders }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver, { returnType, typedHeaders })

  const groupedParam = buildGroupedRequestParam(node, { resolver: tsResolver, withContentType: true })
  const hasMutationParams = groupedParam !== null
  const groupedParamsNode = ast.factory.createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
  const argBindingStr = hasMutationParams ? printParams(groupedParamsNode, 'call') : ''
  const TRequest = resolveMutationRequestType(node, tsResolver)
  const mutationFnBody = buildCallResultBody(
    buildClientCall(node, {
      clientName,
      signal: false,
      withContentType: true,
      // Pin the payload type: an optional `value` property can otherwise drive Vue's ref inference.
      unwrapName: (name) => `toValue<${TRequest}['${name}']>(${name})`,
    }),
    { clientReturnType, returnType },
  )
  const generics = [TData, TError, TRequest, 'TContext'].join(', ')

  const paramsNode = buildMutationParamsNode(node, { resolver: tsResolver, returnType, typedHeaders })

  return (
    <Function name={name} export params={paramsNode} comments={getComments(node)} generics={['TContext']}>
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
  )
}
