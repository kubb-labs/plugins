import type { ast } from '@kubb/core'
import type { FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildGroupedRequestParam, buildSlimClientCall } from '@internals/tanstack-query'
import type { PluginSwr } from '../types.ts'
import { buildRequestConfigType, buildStatusUnionType, getComments, resolveErrorNames } from '../utils.ts'

type Props = {
  name: string
  clientName: string
  mutationKeyName: string
  mutationKeyTypeName: string
  mutationArgTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
  slim?: boolean
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function buildMutationParamsNode(
  node: ast.OperationNode,
  options: {
    dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
    mutationKeyTypeName: string
    mutationArgTypeName: string
    resolver: ResolverTs
    slim?: boolean
  },
): FunctionParametersNode {
  const { dataReturnType, mutationKeyTypeName, mutationArgTypeName, resolver, slim = false } = options
  const responseName = resolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, resolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, resolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  return createFunctionParameters({
    params: [
      createFunctionParameter({
        name: 'options',
        type: `{
  mutation?: SWRMutationConfiguration<${TData}, ${TError}, ${mutationKeyTypeName} | null, ${mutationArgTypeName}> & { throwOnError?: boolean },
  client?: ${buildRequestConfigType(node, resolver, { slim })},
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
  dataReturnType,
  node,
  tsResolver,
  slim = false,
}: Props): KubbReactNode {
  const responseName = tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const groupedParam = buildGroupedRequestParam(node, { resolver: tsResolver })
  const hasMutationParams = groupedParam !== null
  const groupedParamsNode = createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
  const argTypeBody = hasMutationParams ? tsResolver.resolveRequestConfigName(node) : ''
  const argBindingStr = hasMutationParams ? (callPrinter.print(groupedParamsNode) ?? '') : ''
  const clientCallStr = [hasMutationParams ? argBindingStr : null, 'config'].filter(Boolean).join(', ')
  const mutationFnBody = slim
    ? `const { data } = await ${buildSlimClientCall(node, { clientName, signal: false })}
            return data`
    : `return ${clientName}(${clientCallStr})`

  const generics = [TData, TError, `${mutationKeyTypeName} | null`, mutationArgTypeName]

  const paramsNode = buildMutationParamsNode(node, {
    dataReturnType,
    mutationKeyTypeName,
    mutationArgTypeName,
    resolver: tsResolver,
    slim,
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
