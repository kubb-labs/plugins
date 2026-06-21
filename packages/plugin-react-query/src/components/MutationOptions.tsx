import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
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

export function buildMutationConfigParamsNode(node: ast.OperationNode): ast.FunctionParametersNode {
  return ast.factory.createFunctionParameters({
    params: [
      ast.factory.createFunctionParameter({
        name: 'config',
        type: buildRequestConfigType(node),
        default: '{}',
      }),
    ],
  })
}

export function MutationOptions({ name, clientName, node, tsResolver, mutationKeyName }: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const TData = responseName
  const errorNames = resolveErrorNames(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const configParamsNode = buildMutationConfigParamsNode(node)
  const paramsSignature = declarationPrinter.print(configParamsNode) ?? ''

  const groupedParam = buildGroupedRequestParam(node, { resolver: tsResolver })
  const hasMutationParams = groupedParam !== null

  const groupedParamsNode = ast.factory.createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
  const TRequest = hasMutationParams ? tsResolver.resolveRequestConfigName(node) : 'undefined'
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
