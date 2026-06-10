import type { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildQueryOptionsParams, getEnabledParamNames, markParamsOptional } from '@internals/tanstack-query'
import type { PluginVueQuery } from '../types.ts'
import { buildStatusUnionType, resolveErrorNames, resolveSuccessNames, wrapWithMaybeRefOrGetter } from '../utils.ts'
import { buildQueryKeyParamsNode } from './QueryKey.tsx'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginVueQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function getQueryOptionsParams(
  node: ast.OperationNode,
  options: {
    paramsType: PluginVueQuery['resolvedOptions']['paramsType']
    paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
    pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  return wrapWithMaybeRefOrGetter(buildQueryOptionsParams(node, options), (name) => name === 'config')
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
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const queryKeyParamsNode = buildQueryKeyParamsNode(node, { pathParamsType, paramsCasing, resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const enabledNames = getEnabledParamNames(queryKeyParamsNode)
  const enabledText = enabledNames.length ? `enabled: () => ${enabledNames.map((n) => `!!toValue(${n})`).join(' && ')},` : ''

  const paramsNode = markParamsOptional(getQueryOptionsParams(node, { paramsType, paramsCasing, pathParamsType, resolver: tsResolver }), enabledNames)
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const rawParamsCall = callPrinter.print(paramsNode) ?? ''

  // Transform: wrap non-config params with toValue(), add signal to config
  const clientCallStr = rawParamsCall.replace(/\bconfig\b(?=[^,]*$)/, '{ ...config, signal: config.signal ?? signal }')

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature}>
        {`
      const queryKey = ${queryKeyName}(${queryKeyParamsCall})
      return queryOptions<${TData}, ${TError}, ${TData}>({${enabledText ? `\n       ${enabledText}` : ''}
       queryKey,
       queryFn: async ({ signal }) => {
          return ${clientName}(${addToValueCalls(clientCallStr, enabledNames)})
       },
      })
`}
      </Function>
    </File.Source>
  )
}

/**
 * Wraps parameter names with `toValue()` in the client call string,
 * except for 'config'-related params (which are already plain objects).
 *
 * Handles both inline params (`petId, config`) and object shorthand
 * params (`{ petId }, config`) by expanding to `{ petId: toValue(petId) }`.
 */
function addToValueCalls(callStr: string, enabledNames: ReadonlyArray<string> = []): string {
  const optional = new Set(enabledNames)
  // Step 1: Transform shorthand object params like { petId } → { petId: toValue(petId) }
  // Params that drive the `enabled` guard are optional, so assert non-null: toValue(petId!)
  let result = callStr.replace(/\{\s*([\w,\s]+)\s*\}(?=\s*,)/g, (match, inner: string) => {
    // Only transform simple shorthand (no colons, no spread)
    if (inner.includes(':') || inner.includes('...')) return match
    const keys = inner
      .split(',')
      .map((k: string) => k.trim())
      .filter(Boolean)
    const wrapped = keys.map((k: string) => `${k}: toValue(${optional.has(k) ? `${k}!` : k})`).join(', ')
    return `{ ${wrapped} }`
  })

  // Step 2: Handle standalone identifiers like `data, params`
  result = result.replace(/(?<![{.:?])\b(\w+)\b(?=\s*,)/g, (match, name: string) => {
    if (name === 'config' || name === 'signal' || name === 'undefined') return match
    if (match.includes('toValue(')) return match
    return `toValue(${optional.has(name) ? `${name}!` : name})`
  })

  return result
}
