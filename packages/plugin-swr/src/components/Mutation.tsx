import type { ast } from '@kubb/kit'
import type { FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildCallResultBody, buildGroupedRequestParam, buildClientCall, buildResponseTypes } from '@internals/tanstack-query'
import type { HookReturnType } from '@internals/tanstack-query'
import { buildOperationComments as getComments, buildRequestConfigType } from '@internals/shared'

type Props = {
  name: string
  clientName: string
  mutationKeyName: string
  mutationKeyTypeName: string
  mutationArgTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  /**
   * The registered client plugin's `returnType`, read by the caller off `resolveClientOperation`.
   *
   * @default 'full'
   */
  clientReturnType?: 'full' | 'data' | 'plain'
  returnType?: HookReturnType
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function buildMutationParamsNode(
  node: ast.OperationNode,
  options: {
    mutationKeyTypeName: string
    mutationArgTypeName: string
    resolver: ResolverTs
    returnType: HookReturnType
  },
): FunctionParametersNode {
  const { mutationKeyTypeName, mutationArgTypeName, resolver, returnType } = options
  const { TData, TError } = buildResponseTypes(node, resolver, { returnType })

  return createFunctionParameters({
    params: [
      createFunctionParameter({
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
  clientReturnType = 'full',
  returnType = 'data',
}: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver, { returnType })

  const groupedParam = buildGroupedRequestParam(node, { resolver: tsResolver, withContentType: true })
  const hasMutationParams = groupedParam !== null
  const groupedParamsNode = createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
  const argTypeBody = hasMutationParams ? tsResolver.response.options(node) : ''
  const argBindingStr = hasMutationParams ? (callPrinter.print(groupedParamsNode) ?? '') : ''
  const mutationFnBody = buildCallResultBody(buildClientCall(node, { clientName, signal: false, withContentType: true, returnType: clientReturnType }), {
    clientReturnType,
    returnType,
  })

  const generics = [TData, TError, `${mutationKeyTypeName} | null`, mutationArgTypeName]

  const paramsNode = buildMutationParamsNode(node, {
    mutationKeyTypeName,
    mutationArgTypeName,
    resolver: tsResolver,
    returnType,
  })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <>
      <File.Source name={mutationArgTypeName} isExportable isIndexable isTypeOnly>
        <Type name={mutationArgTypeName} export>
          {hasMutationParams ? argTypeBody : 'never'}
        </Type>
      </File.Source>
      <File.Source name={name} isExportable isIndexable>
        <Function name={name} export params={paramsSignature} JSDoc={{ comments: getComments(node) }}>
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
      </File.Source>
    </>
  )
}
