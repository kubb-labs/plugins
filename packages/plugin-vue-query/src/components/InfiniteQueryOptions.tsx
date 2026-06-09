import { getOperationParameters } from '@internals/shared'
import { getNestedAccessor } from '@internals/utils'
import type { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { Infinite, PluginVueQuery } from '../types.ts'
import { resolveErrorNames, resolveSuccessNames } from '../utils.ts'
import { buildQueryKeyParamsNode } from './QueryKey.tsx'
import { getEnabledParamNames, markParamsOptional } from '@internals/tanstack-query'
import { getQueryOptionsParams } from './QueryOptions.tsx'

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
  initialPageParam: Infinite['initialPageParam']
  cursorParam: Infinite['cursorParam']
  nextParam: Infinite['nextParam']
  previousParam: Infinite['previousParam']
  queryParam: Infinite['queryParam']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function InfiniteQueryOptions({
  name,
  clientName,
  initialPageParam,
  cursorParam,
  nextParam,
  previousParam,
  node,
  tsResolver,
  paramsCasing,
  paramsType,
  dataReturnType,
  pathParamsType,
  queryParam,
  queryKeyName,
}: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const queryFnDataType = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const errorNames = resolveErrorNames(node, tsResolver)
  const errorType = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const isInitialPageParamDefined = initialPageParam !== undefined && initialPageParam !== null
  const fallbackPageParamType =
    typeof initialPageParam === 'number'
      ? 'number'
      : typeof initialPageParam === 'string'
        ? initialPageParam.includes(' as ')
          ? (() => {
              const parts = initialPageParam.split(' as ')
              return parts[parts.length - 1] ?? 'unknown'
            })()
          : 'string'
        : typeof initialPageParam === 'boolean'
          ? 'boolean'
          : 'unknown'

  const rawQueryParams = getOperationParameters(node).query
  const queryParamsTypeName =
    rawQueryParams.length > 0
      ? (() => {
          const groupName = tsResolver.resolveQueryParamsName(node, rawQueryParams[0]!)
          const individualName = tsResolver.resolveParamName(node, rawQueryParams[0]!)
          return groupName !== individualName ? groupName : null
        })()
      : null

  const queryParamType = queryParam && queryParamsTypeName ? `${queryParamsTypeName}['${queryParam}']` : null
  const pageParamType = queryParamType ? (isInitialPageParamDefined ? `NonNullable<${queryParamType}>` : queryParamType) : fallbackPageParamType

  const queryKeyParamsNode = buildQueryKeyParamsNode(node, { pathParamsType, paramsCasing, resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const enabledNames = getEnabledParamNames(queryKeyParamsNode)
  const enabledText = enabledNames.length ? `enabled: () => ${enabledNames.map((n) => `!!toValue(${n})`).join(' && ')},` : ''

  const paramsNode = markParamsOptional(getQueryOptionsParams(node, { paramsType, paramsCasing, pathParamsType, resolver: tsResolver }), enabledNames)
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const rawParamsCall = callPrinter.print(paramsNode) ?? ''
  const clientCallStr = rawParamsCall.replace(/\bconfig\b(?=[^,]*$)/, '{ ...config, signal: config.signal ?? signal }')

  const hasNewParams = nextParam != null || previousParam != null

  const [getNextPageParamExpr, getPreviousPageParamExpr] = (() => {
    if (hasNewParams) {
      const nextAccessor = nextParam ? getNestedAccessor(nextParam, 'lastPage') : null
      const prevAccessor = previousParam ? getNestedAccessor(previousParam, 'firstPage') : null
      return [
        nextAccessor ? `getNextPageParam: (lastPage) => ${nextAccessor}` : null,
        prevAccessor ? `getPreviousPageParam: (firstPage) => ${prevAccessor}` : null,
      ] as const
    }
    if (cursorParam) {
      return [`getNextPageParam: (lastPage) => lastPage['${cursorParam}']`, `getPreviousPageParam: (firstPage) => firstPage['${cursorParam}']`] as const
    }
    return [
      dataReturnType === 'full'
        ? 'getNextPageParam: (lastPage, _allPages, lastPageParam) => Array.isArray(lastPage.data) && lastPage.data.length === 0 ? undefined : lastPageParam + 1'
        : 'getNextPageParam: (lastPage, _allPages, lastPageParam) => Array.isArray(lastPage) && lastPage.length === 0 ? undefined : lastPageParam + 1',
      'getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => firstPageParam <= 1 ? undefined : firstPageParam - 1',
    ] as const
  })()

  const queryOptionsArr = [
    `initialPageParam: ${typeof initialPageParam === 'string' ? JSON.stringify(initialPageParam) : initialPageParam}`,
    getNextPageParamExpr,
    getPreviousPageParamExpr,
  ].filter(Boolean)

  const infiniteOverrideParams =
    queryParam && queryParamsTypeName
      ? `
          params = {
            ...(params ?? {}),
            ['${queryParam}']: pageParam as unknown as ${queryParamsTypeName}['${queryParam}'],
          } as ${queryParamsTypeName}`
      : ''

  if (infiniteOverrideParams) {
    return (
      <File.Source name={name} isExportable isIndexable>
        <Function name={name} export params={paramsSignature}>
          {`
const queryKey = ${queryKeyName}(${queryKeyParamsCall})
return infiniteQueryOptions<${queryFnDataType}, ${errorType}, InfiniteData<${queryFnDataType}>, QueryKey, ${pageParamType}>({
  ${enabledText}
  queryKey,
  queryFn: async ({ signal, pageParam }) => {
    ${infiniteOverrideParams}
    return ${clientName}(${addToValueCalls(clientCallStr, enabledNames)})
  },
  ${queryOptionsArr.join(',\n  ')}
})
`}
        </Function>
      </File.Source>
    )
  }

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature}>
        {`
const queryKey = ${queryKeyName}(${queryKeyParamsCall})
return infiniteQueryOptions<${queryFnDataType}, ${errorType}, InfiniteData<${queryFnDataType}>, QueryKey, ${pageParamType}>({
  ${enabledText}
  queryKey,
  queryFn: async ({ signal }) => {
    return ${clientName}(${addToValueCalls(clientCallStr, enabledNames)})
  },
  ${queryOptionsArr.join(',\n  ')}
})
`}
      </Function>
    </File.Source>
  )
}

function addToValueCalls(callStr: string, enabledNames: ReadonlyArray<string> = []): string {
  const optional = new Set(enabledNames)
  // Step 1: Transform shorthand object params like { petId } → { petId: toValue(petId) }
  // Params that drive the `enabled` guard are optional, so assert non-null: toValue(petId!)
  let result = callStr.replace(/\{\s*([\w,\s]+)\s*\}(?=\s*,)/g, (match, inner: string) => {
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
