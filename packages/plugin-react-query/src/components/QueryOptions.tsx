import type { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildQueryOptionsParams, getEnabledParamNames, injectNonNullAssertions, markParamsOptional } from '@internals/tanstack-query'
import type { PluginReactQuery } from '../types.ts'
import { buildQueryKeyParams, buildStatusUnionType, resolveErrorNames, resolveSuccessNames } from '../utils.ts'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  suspense?: boolean
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function getQueryOptionsParams(node: ast.OperationNode, options: { resolver: ResolverTs }): ast.FunctionParametersNode {
  return buildQueryOptionsParams(node, options)
}

export function QueryOptions({ name, clientName, dataReturnType, node, tsResolver, queryKeyName, suspense }: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const queryKeyParamsNode = buildQueryKeyParams(node, { resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const enabledNames = getEnabledParamNames(queryKeyParamsNode)
  // Suspense queries can't be disabled, so their params stay required.
  const optionalNames = suspense ? [] : enabledNames
  const enabledText = suspense ? '' : enabledNames.length ? `enabled: !!(${enabledNames.join(' && ')}),` : ''

  const paramsNode = markParamsOptional(getQueryOptionsParams(node, { resolver: tsResolver }), optionalNames)
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const rawParamsCall = callPrinter.print(paramsNode) ?? ''
  const clientCallStr = injectNonNullAssertions(rawParamsCall.replace(/\bconfig\b(?=[^,]*$)/, '{ ...config, signal: config.signal ?? signal }'), optionalNames)

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature}>
        {`
      const queryKey = ${queryKeyName}(${queryKeyParamsCall})
      return queryOptions<${TData}, ${TError}, ${TData}, typeof queryKey>({${enabledText ? `\n       ${enabledText}` : ''}
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
