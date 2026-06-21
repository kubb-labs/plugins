import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildGroupedRequestParam } from '@internals/tanstack-query'
import type { PluginReactQuery } from '../types.ts'
import { buildRequestConfigType, getComments, resolveErrorNames, resolveSuccessNames } from '../utils.ts'
import { buildMutationConfigParamsNode } from './MutationOptions.tsx'

type Props = {
  name: string
  typeName: string
  mutationOptionsName: string
  mutationKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  customOptions: PluginReactQuery['resolvedOptions']['customOptions']
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
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  const { resolver } = options
  const successNames = resolveSuccessNames(node, resolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : resolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, resolver)

  const TData = responseName
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const TRequest = resolveMutationRequestType(node, resolver)
  const generics = [TData, TError, TRequest, 'TContext'].join(', ')

  return ast.factory.createFunctionParameters({
    params: [
      ast.factory.createFunctionParameter({
        name: 'options',
        type: `{
  mutation?: UseMutationOptions<${generics}> & { client?: QueryClient },
  client?: ${buildRequestConfigType(node)},
}`,
        default: '{}',
      }),
    ],
  })
}

export function Mutation({ name, mutationOptionsName, node, tsResolver, mutationKeyName, customOptions }: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = responseName
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const TRequest = resolveMutationRequestType(node, tsResolver)
  const generics = [TData, TError, TRequest, 'TContext'].join(', ')
  const returnType = `UseMutationResult<${generics}>`

  const mutationOptionsConfigNode = buildMutationConfigParamsNode(node)
  const mutationOptionsParamsCall = callPrinter.print(mutationOptionsConfigNode) ?? ''

  const paramsNode = buildMutationParamsNode(node, { resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature} JSDoc={{ comments: getComments(node) }} generics={['TContext']}>
        {`
        const { mutation = {}, client: config = {} } = options ?? {}
        const { client: queryClient, ...mutationOptions } = mutation;
        const mutationKey = mutationOptions.mutationKey ?? ${mutationKeyName}()

        const baseOptions = ${mutationOptionsName}(${mutationOptionsParamsCall}) as UseMutationOptions<${generics}>${customOptions ? `\n        const customOptions = ${customOptions.name}({ hookName: '${name}', operationId: '${node.operationId}' }) as UseMutationOptions<${generics}>` : ''}

        return useMutation<${generics}>({
          ...baseOptions,${customOptions ? '\n          ...customOptions,' : ''}
          mutationKey,
          ...mutationOptions,
        }, queryClient) as ${returnType}
    `}
      </Function>
    </File.Source>
  )
}
