import type { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { Function, printParams } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildHookParams, buildResponseTypes, resolveMutationRequestType } from '@internals/tanstack-query'
import type { HookResultProps } from '@internals/tanstack-query'
import type { ReturnTypeOption } from '@internals/client'
import type { PluginReactQuery } from '../types.ts'
import { buildOperationComments as getComments, buildRequestConfigType } from '@internals/shared'
import { buildMutationConfigParamsNode } from './MutationOptions.tsx'

type Props = {
  name: string
  mutationOptionsName: string
  mutationKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  customOptions: PluginReactQuery['resolvedOptions']['customOptions']
} & HookResultProps

function buildMutationParamsNode(
  node: ast.OperationNode,
  options: { resolver: ResolverTs; returnType: ReturnTypeOption; typedHeaders?: boolean },
): ast.FunctionParametersNode {
  const { resolver, returnType, typedHeaders } = options
  const { TData, TError } = buildResponseTypes(node, resolver, { returnType, typedHeaders })
  const generics = [TData, TError, resolveMutationRequestType(node, resolver), 'TContext'].join(', ')

  return buildHookParams(node, {
    resolver,
    withRequest: false,
    optionsType: `{
  mutation?: UseMutationOptions<${generics}> & { client?: QueryClient },
  client?: ${buildRequestConfigType(node)},
}`,
  })
}

export function Mutation({ name, mutationOptionsName, node, tsResolver, mutationKeyName, customOptions, returnType, typedHeaders }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver, { returnType, typedHeaders })

  const TRequest = resolveMutationRequestType(node, tsResolver)
  const generics = [TData, TError, TRequest, 'TContext'].join(', ')
  const resultType = `UseMutationResult<${generics}>`

  const mutationOptionsConfigNode = buildMutationConfigParamsNode(node)
  const mutationOptionsParamsCall = printParams(mutationOptionsConfigNode, 'call')

  const paramsNode = buildMutationParamsNode(node, { resolver: tsResolver, returnType, typedHeaders })

  return (
    <Function name={name} export params={paramsNode} comments={getComments(node)} generics={['TContext']}>
      {`
        const { mutation = {}, client: config = {} } = options ?? {}
        const { client: queryClient, ...mutationOptions } = mutation;
        const mutationKey = mutationOptions.mutationKey ?? ${mutationKeyName}()

        const baseOptions = ${mutationOptionsName}(${mutationOptionsParamsCall}) as UseMutationOptions<${generics}>${customOptions ? `\n        const customOptions = ${customOptions.name}({ hookName: '${name}', operationId: '${node.operationId}' }) as UseMutationOptions<${generics}>` : ''}

        return useMutation<${generics}>({
          ...baseOptions,${customOptions ? '\n          ...customOptions,' : ''}
          mutationKey,
          ...mutationOptions,
        }, queryClient) as ${resultType}
    `}
    </Function>
  )
}
