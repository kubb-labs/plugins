import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginReactQuery } from '../types.ts'
import { resolveErrorNames } from '../utils.ts'
import { QueryKey } from './QueryKey.tsx'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginReactQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function getQueryOptionsParams(
  node: ast.OperationNode,
  options: {
    paramsType: PluginReactQuery['resolvedOptions']['paramsType']
    paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
    pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  const { paramsType, paramsCasing, pathParamsType, resolver } = options
  const requestName = node.requestBody?.schema ? resolver.resolveDataName(node) : undefined

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

export function buildEnabledCheck(paramsNode: ast.FunctionParametersNode): string {
  const required: string[] = []
  for (const param of paramsNode.params) {
    if ('kind' in param && (param as ast.ParameterGroupNode).kind === 'ParameterGroup') {
      const group = param as ast.ParameterGroupNode
      for (const child of group.properties) {
        if (!child.optional && child.default === undefined) {
          required.push(child.name)
        }
      }
    } else {
      const fp = param as ast.FunctionParameterNode
      if (!fp.optional && fp.default === undefined) {
        required.push(fp.name)
      }
    }
  }
  return required.join(' && ')
}

export function QueryOptions({
  name,
  clientName,
  dataReturnType,
  node,
  tsResolver,
  paramsCasing,
  paramsType,
  pathParamsType,
  queryKeyName,
}: Props): KubbReactNode {
  const responseName = tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const paramsNode = getQueryOptionsParams(node, { paramsType, paramsCasing, pathParamsType, resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const rawParamsCall = callPrinter.print(paramsNode) ?? ''
  const clientCallStr = rawParamsCall.replace(/\bconfig\b(?=[^,]*$)/, '{ ...config, signal: config.signal ?? signal }')

  const queryKeyParamsNode = QueryKey.getParams(node, { pathParamsType, paramsCasing, resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const enabledSource = buildEnabledCheck(queryKeyParamsNode)
  const enabledText = enabledSource ? `enabled: !!(${enabledSource}),` : ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature}>
        {`
      const queryKey = ${queryKeyName}(${queryKeyParamsCall})
      return queryOptions<${TData}, ${TError}, ${TData}, typeof queryKey>({
       ${enabledText}
       queryKey,
       queryFn: async ({ signal }) => {
          return ${clientName}(${clientCallStr})
       },
      })
`}
      </Function>
    </File.Source>
  )
}

QueryOptions.getParams = getQueryOptionsParams
