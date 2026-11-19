import { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildCallResultBody, buildGroupedRequestParam, buildClientCall, buildResponseTypes, resolveMutationRequestType } from '@internals/tanstack-query'
import type { CallReturnTypeProps } from '@internals/tanstack-query'
import type { ReturnTypeOption } from '@internals/client'
import { buildOperationComments as getComments, buildRequestConfigType } from '@internals/shared'

type Props = {
  name: string
  clientName: string
  mutationKeyName: string
  mutationKeyTypeName: string
  mutationArgTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
} & CallReturnTypeProps

function buildMutationParamsNode(
  node: ast.OperationNode,
  options: {
    mutationKeyTypeName: string
    mutationArgTypeName: string
    resolver: ResolverTs
    returnType: ReturnTypeOption
    typedHeaders?: boolean
  },
): ast.FunctionParametersNode {
  const { mutationKeyTypeName, mutationArgTypeName, resolver, returnType, typedHeaders } = options
  const { TData, TError } = buildResponseTypes(node, resolver, { returnType, typedHeaders })

  return ast.factory.createFunctionParameters({
    params: [
      ast.factory.createFunctionParameter({
        name: 'options',
        type: `{
  mutation?: SWRMutationConfiguration<${TData}, ${TError}, ${mutationKeyTypeName} | null, ${mutationArgTypeName}> & { throwOnError?: boolean },
  client?: ${buildRequestConfigType(node)},
  shouldFetch?: boolean,
}`,
        default: '{}',
      }),
    ],
  })
}

export function Mutation({
  name,
  clientName,
  mutationKeyName,
  mutationKeyTypeName,
  mutationArgTypeName,
  node,
  tsResolver,
  clientReturnType,
  returnType,
  typedHeaders,
}: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver, { returnType, typedHeaders })

  const groupedParam = buildGroupedRequestParam(node, { resolver: tsResolver, withContentType: true })
  const hasMutationParams = groupedParam !== null
  const groupedParamsNode = ast.factory.createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
  const argTypeBody = hasMutationParams ? resolveMutationRequestType(node, tsResolver) : ''
  const argBindingStr = hasMutationParams ? ast.params.print(groupedParamsNode, 'call') : ''
  const mutationFnBody = buildCallResultBody(buildClientCall(node, { clientName, signal: false, withContentType: true }), {
    clientReturnType,
    returnType,
  })

  const generics = [TData, TError, `${mutationKeyTypeName} | null`, mutationArgTypeName]

  const paramsNode = buildMutationParamsNode(node, {
    mutationKeyTypeName,
    mutationArgTypeName,
    resolver: tsResolver,
    returnType,
    typedHeaders,
  })

  return (
    <>
      <Type name={mutationArgTypeName} export>
        {hasMutationParams ? argTypeBody : 'never'}
      </Type>
      <Function name={name} export params={paramsNode} JSDoc={{ comments: getComments(node) }}>
        {`
        const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
        const mutationKey = ${mutationKeyName}()

        return useSWRMutation<${generics.join(', ')}>(
          shouldFetch ? mutationKey : null,
          async (_url${hasMutationParams ? `, { arg: ${argBindingStr} }` : ''}) => {
            ${mutationFnBody}
          },
          mutationOptions
        )
    `}
      </Function>
    </>
  )
}
