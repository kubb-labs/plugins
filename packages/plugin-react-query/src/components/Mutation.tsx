import type { ast } from 'kubb/kit'
import type { FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import { buildGroupedRequestParam } from '@internals/tanstack-query'
import type { PluginReactQuery } from '../types.ts'
import { buildRequestConfigType, buildResponseTypes, getComments } from '../utils.ts'
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
  const generics = [TData, TError, TRequest, 'TContext'].join(', ')

  return createFunctionParameters({
    params: [
      createFunctionParameter({
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
  const { TData, TError } = buildResponseTypes(node, tsResolver)

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
