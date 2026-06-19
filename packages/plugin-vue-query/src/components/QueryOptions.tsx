import type { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { buildQueryOptionsParams, hasRequiredPathParams } from '@internals/tanstack-query'
import type { PluginVueQuery } from '../types.ts'
import { buildStatusUnionType, maybeRefOrGetter, resolveErrorNames, resolveSuccessNames } from '../utils.ts'
import { buildQueryKeyParamsNode } from './QueryKey.tsx'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function getQueryOptionsParams(node: ast.OperationNode, options: { resolver: ResolverTs }): ast.FunctionParametersNode {
  return buildQueryOptionsParams(node, { resolver: options.resolver, memberTypeWrapper: maybeRefOrGetter })
}

export function QueryOptions({ name, clientName, dataReturnType, node, tsResolver, queryKeyName }: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : buildStatusUnionType(node, tsResolver)
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const queryKeyParamsNode = buildQueryKeyParamsNode(node, { resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const enabledText = hasRequiredPathParams(node) ? 'enabled: () => !!toValue(path),' : ''

  const paramsNode = getQueryOptionsParams(node, { resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const rawParamsCall = callPrinter.print(paramsNode) ?? ''

  // Transform: wrap grouped params with toValue(), add signal to config
  const clientCallStr = rawParamsCall.replace(/\bconfig\b(?=[^,]*$)/, '{ ...config, signal: config.signal ?? signal }')

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature}>
        {`
      const queryKey = ${queryKeyName}(${queryKeyParamsCall})
      return queryOptions<${TData}, ${TError}, ${TData}>({${enabledText ? `\n       ${enabledText}` : ''}
       queryKey,
       queryFn: async ({ signal }) => {
          return ${clientName}(${addToValueCalls(clientCallStr)})
       },
      })
`}
      </Function>
    </File.Source>
  )
}

/**
 * Wraps the grouped request options with `toValue()` in the client call string, expanding the
 * shorthand `{ path, query }` binding to `{ path: toValue(path), query: toValue(query) }`. The
 * trailing config object is left untouched since it is already a plain object.
 */
function addToValueCalls(callStr: string): string {
  return callStr.replace(/\{\s*([\w,\s]+)\s*\}(?=\s*,)/g, (match, inner: string) => {
    if (inner.includes(':') || inner.includes('...')) return match
    const keys = inner
      .split(',')
      .map((k: string) => k.trim())
      .filter(Boolean)
    const wrapped = keys.map((k: string) => `${k}: toValue(${k})`).join(', ')
    return `{ ${wrapped} }`
  })
}
