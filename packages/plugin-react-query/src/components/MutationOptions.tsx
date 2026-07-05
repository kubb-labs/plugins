import type { ast } from 'kubb/kit'
import type { FunctionParametersNode, ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameter, createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import { buildGroupedRequestParam, buildClientCall } from '@internals/tanstack-query'
import { buildRequestConfigType, resolveErrorNames, resolveSuccessNames } from '../utils.ts'

type Props = {
  name: string
  clientName: string
  mutationKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function buildMutationConfigParamsNode(node: ast.OperationNode): FunctionParametersNode {
  return createFunctionParameters({
    params: [
      createFunctionParameter({
        name: 'config',
        type: buildRequestConfigType(node),
        default: '{}',
      }),
    ],
  })
}

export function MutationOptions({ name, clientName, node, tsResolver, mutationKeyName }: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.response.response(node)
  const TData = responseName
  const errorNames = resolveErrorNames(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const configParamsNode = buildMutationConfigParamsNode(node)
  const paramsSignature = declarationPrinter.print(configParamsNode) ?? ''

  const groupedParam = buildGroupedRequestParam(node, { resolver: tsResolver })
  const hasMutationParams = groupedParam !== null

  const groupedParamsNode = createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
  const TRequest = hasMutationParams ? tsResolver.response.config(node) : 'undefined'
  const argBindingStr = hasMutationParams ? (callPrinter.print(groupedParamsNode) ?? '') : '_'
  const mutationFnBody = `const { data } = await ${buildClientCall(node, { clientName, signal: false })}
          return data`

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature} generics={['TContext = unknown']}>
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
    </File.Source>
  )
}
