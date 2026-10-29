import type { ast } from '@kubb/kit'
import type { FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import {
  buildCallResultBody,
  buildClientCall,
  buildGroupedRequestParam,
  buildHookParams,
  buildResponseTypes,
  resolveMutationRequestType,
} from '@internals/tanstack-query'
import { buildRequestConfigType, getComments } from '../utils.ts'

type Props = {
  name: string
  clientName: string
  mutationKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  /**
   * The registered client plugin's `returnType`, read by the caller off `resolveClientOperation`.
   *
   * @default 'full'
   */
  returnType?: 'full' | 'data' | 'plain'
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function buildMutationParamsNode(node: ast.OperationNode, options: { resolver: ResolverTs }): FunctionParametersNode {
  const { resolver } = options
  const { TData, TError } = buildResponseTypes(node, resolver)

  return buildHookParams(node, {
    resolver,
    withRequest: false,
    optionsType: `{
  mutation?: MutationObserverOptions<${[TData, TError, resolveMutationRequestType(node, resolver), 'TContext'].join(', ')}> & { client?: QueryClient },
  client?: ${buildRequestConfigType(node)},
}`,
  })
}

export function Mutation({ name, clientName, node, tsResolver, mutationKeyName, returnType = 'full' }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver)

  const groupedParam = buildGroupedRequestParam(node, { resolver: tsResolver, withContentType: true })
  const hasMutationParams = groupedParam !== null
  const groupedParamsNode = createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
  const argBindingStr = hasMutationParams ? (callPrinter.print(groupedParamsNode) ?? '') : ''
  const TRequest = resolveMutationRequestType(node, tsResolver)
  const mutationFnBody = buildCallResultBody(
    buildClientCall(node, {
      clientName,
      signal: false,
      withContentType: true,
      returnType,
      // Pin the payload type: an optional `value` property can otherwise drive Vue's ref inference.
      unwrapName: (name) => `toValue<${TRequest}['${name}']>(${name})`,
    }),
    { returnType },
  )
  const generics = [TData, TError, TRequest, 'TContext'].join(', ')

  const paramsNode = buildMutationParamsNode(node, { resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature} JSDoc={{ comments: getComments(node) }} generics={['TContext']}>
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
    </File.Source>
  )
}
