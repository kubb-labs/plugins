import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
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
  paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
  paramsType: PluginSwr['resolvedOptions']['paramsType']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
  dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })
const keysPrinter = functionPrinter({ mode: 'call' })

function createMutationArgParams(
  node: ast.OperationNode,
  options: {
    paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  return ast.createOperationParams(node, {
    paramsType: 'inline',
    pathParamsType: 'inline',
    paramsCasing: options.paramsCasing,
    resolver: options.resolver,
  })
}

function buildMutationParamsNode(
  node: ast.OperationNode,
  options: {
    paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
    dataReturnType: PluginSwr['resolvedOptions']['client']['dataReturnType']
    mutationKeyTypeName: string
    mutationArgTypeName: string
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  const { dataReturnType, mutationKeyTypeName, mutationArgTypeName, resolver } = options
  const responseName = resolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, resolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, resolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  return ast.createFunctionParameters({
    params: [
      ast.createFunctionParameter({
        name: 'options',
        type: `{
  mutation?: SWRMutationConfiguration<${TData}, ${TError}, ${mutationKeyTypeName} | null, ${mutationArgTypeName}> & { throwOnError?: boolean },
  client?: ${buildRequestConfigType(node, resolver)},
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
  paramsCasing,
  paramsType,
  pathParamsType,
  dataReturnType,
  node,
  tsResolver,
}: Props): KubbReactNode {
  const responseName = tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const mutationArgParamsNode = createMutationArgParams(node, { paramsCasing, resolver: tsResolver })
  const hasMutationParams = mutationArgParamsNode.params.length > 0
  const argTypeBody = hasMutationParams ? (declarationPrinter.print(mutationArgParamsNode) ?? '') : ''
  const argKeysStr = hasMutationParams ? (keysPrinter.print(mutationArgParamsNode) ?? '') : ''

  const generics = [TData, TError, `${mutationKeyTypeName} | null`, mutationArgTypeName]

  const paramsNode = buildMutationParamsNode(node, {
    paramsCasing,
    dataReturnType,
    mutationKeyTypeName,
    mutationArgTypeName,
    resolver: tsResolver,
  })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  const clientCallParamsNode = ast.createOperationParams(node, {
    paramsType,
    pathParamsType: paramsType === 'object' ? 'object' : pathParamsType === 'object' ? 'object' : 'inline',
    paramsCasing,
    resolver: tsResolver,
    extraParams: [
      ast.createFunctionParameter({
        name: 'config',
        type: buildRequestConfigType(node, tsResolver),
        default: '{}',
      }),
    ],
  })
  const clientCallStr = callPrinter.print(clientCallParamsNode) ?? ''

  return (
    <>
      <File.Source name={mutationArgTypeName} isExportable isIndexable isTypeOnly>
        <Type name={mutationArgTypeName} export>
          {hasMutationParams ? `{ ${argTypeBody} }` : 'never'}
        </Type>
      </File.Source>
      <File.Source name={name} isExportable isIndexable>
        <Function name={name} export params={paramsSignature} JSDoc={{ comments: getComments(node) }}>
          {`
        const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
        const mutationKey = ${mutationKeyName}()

        return useSWRMutation<${generics.join(', ')}>(
          shouldFetch ? mutationKey : null,
          async (_url${hasMutationParams ? `, { arg: { ${argKeysStr} } }` : ''}) => {
            return ${clientName}(${clientCallStr})
          },
          mutationOptions
        )
    `}
        </Function>
      </File.Source>
    </>
  )
}
