import type { ast } from 'kubb/kit'
import type { FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function, Type } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import { buildGroupedRequestParam, buildClientCall } from '@internals/tanstack-query'
import { buildRequestConfigType, getComments, resolveErrorNames } from '../utils.ts'

type Props = {
  name: string
  clientName: string
  mutationKeyName: string
  mutationKeyTypeName: string
  mutationArgTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function buildMutationParamsNode(
  node: ast.OperationNode,
  options: {
    mutationKeyTypeName: string
    mutationArgTypeName: string
    resolver: ResolverTs
  },
): FunctionParametersNode {
  const { mutationKeyTypeName, mutationArgTypeName, resolver } = options
  const responseName = resolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, resolver)

  const TData = responseName
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

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

export function Mutation({ name, clientName, mutationKeyName, mutationKeyTypeName, mutationArgTypeName, node, tsResolver }: Props): KubbReactNode {
  const responseName = tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = responseName
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const groupedParam = buildGroupedRequestParam(node, { resolver: tsResolver })
  const hasMutationParams = groupedParam !== null
  const groupedParamsNode = createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
  const argTypeBody = hasMutationParams ? tsResolver.resolveRequestConfigName(node) : ''
  const argBindingStr = hasMutationParams ? (callPrinter.print(groupedParamsNode) ?? '') : ''
  const mutationFnBody = `const { data } = await ${buildClientCall(node, { clientName, signal: false })}
            return data`

  const generics = [TData, TError, `${mutationKeyTypeName} | null`, mutationArgTypeName]

  const paramsNode = buildMutationParamsNode(node, {
    mutationKeyTypeName,
    mutationArgTypeName,
    resolver: tsResolver,
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
