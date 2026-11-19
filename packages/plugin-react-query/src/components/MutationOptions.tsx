import { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { Function, printParams } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildCallResultBody, buildGroupedRequestParam, buildClientCall, resolveMutationRequestType } from '@internals/tanstack-query'
import type { CallReturnTypeProps } from '@internals/tanstack-query'
import { buildRequestConfigType } from '@internals/shared'
import { buildResponseTypes } from '@internals/tanstack-query'

type Props = {
  name: string
  clientName: string
  mutationKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
} & CallReturnTypeProps

export function buildMutationConfigParamsNode(node: ast.OperationNode): ast.FunctionParametersNode {
  return ast.factory.createFunctionParameters({
    params: [
      ast.factory.createFunctionParameter({
        name: 'config',
        type: buildRequestConfigType(node),
        default: '{}',
      }),
    ],
  })
}

export function MutationOptions({ name, clientName, node, tsResolver, mutationKeyName, clientReturnType, returnType, typedHeaders }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver, { returnType, typedHeaders })

  const configParamsNode = buildMutationConfigParamsNode(node)

  const groupedParam = buildGroupedRequestParam(node, { resolver: tsResolver, withContentType: true })
  const hasMutationParams = groupedParam !== null

  const groupedParamsNode = ast.factory.createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
  const TRequest = resolveMutationRequestType(node, tsResolver)
  const argBindingStr = hasMutationParams ? printParams(groupedParamsNode, 'call') : '_'
  const mutationFnBody = buildCallResultBody(buildClientCall(node, { clientName, signal: false, withContentType: true }), {
    clientReturnType,
    returnType,
  })

  return (
    <Function name={name} export params={configParamsNode} generics={['TContext = unknown']}>
      {`
      const mutationKey = ${mutationKeyName}()
      return mutationOptions<${TData}, ${TError}, ${TRequest}, TContext>({
        mutationKey,
        mutationFn: async(${argBindingStr}) => {
          ${mutationFnBody}
        },
      })
`}
    </Function>
  )
}
