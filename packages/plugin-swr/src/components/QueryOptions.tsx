import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { getEnabledParamNames, injectNonNullAssertions, markParamsOptional } from '@internals/tanstack-query'
import type { PluginSwr } from '../types.ts'
import { buildQueryKeyParams } from '../utils.ts'

type Props = {
  name: string
  clientName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
  paramsType: PluginSwr['resolvedOptions']['paramsType']
  pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function getQueryOptionsParams(
  node: ast.OperationNode,
  options: {
    paramsType: PluginSwr['resolvedOptions']['paramsType']
    paramsCasing: PluginSwr['resolvedOptions']['paramsCasing']
    pathParamsType: PluginSwr['resolvedOptions']['pathParamsType']
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  const { paramsType, paramsCasing, pathParamsType, resolver } = options
  const requestName = node.requestBody?.content?.[0]?.schema ? resolver.resolveDataName(node) : undefined

  return ast.createOperationParams(node, {
    paramsType,
    pathParamsType: paramsType === 'object' ? 'object' : pathParamsType === 'object' ? 'object' : 'inline',
    paramsCasing,
    resolver,
    extraParams: [
      ast.createFunctionParameter({
        name: 'config',
        type: ast.createParamsType({
          variant: 'reference',
          name: requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }',
        }),
        default: '{}',
      }),
    ],
  })
}

export function QueryOptions({ name, clientName, node, tsResolver, paramsCasing, paramsType, pathParamsType }: Props): KubbReactNode {
  const queryKeyParamsNode = buildQueryKeyParams(node, { pathParamsType, paramsCasing, resolver: tsResolver })
  const enabledNames = getEnabledParamNames(queryKeyParamsNode)

  const paramsNode = markParamsOptional(getQueryOptionsParams(node, { paramsType, paramsCasing, pathParamsType, resolver: tsResolver }), enabledNames)
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const clientCallStr = injectNonNullAssertions(callPrinter.print(paramsNode) ?? '', enabledNames)

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature}>
        {`
      return {
        fetcher: async () => {
          return ${clientName}(${clientCallStr})
        },
      }
`}
      </Function>
    </File.Source>
  )
}
