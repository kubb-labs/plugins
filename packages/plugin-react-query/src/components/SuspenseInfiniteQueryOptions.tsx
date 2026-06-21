import { getOperationParameters } from '@internals/shared'
import { buildClientCall } from '@internals/tanstack-query'
import { getNestedAccessor } from '@kubb/ast/utils'
import type { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { Infinite } from '../types.ts'
import { buildQueryKeyParams, resolveErrorNames, resolveSuccessNames } from '../utils.ts'
import { getQueryOptionsParams } from './QueryOptions.tsx'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  initialPageParam: Infinite['initialPageParam']
  cursorParam: Infinite['cursorParam']
  nextParam: Infinite['nextParam']
  previousParam: Infinite['previousParam']
  queryParam: Infinite['queryParam']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function SuspenseInfiniteQueryOptions({
  name,
  clientName,
  initialPageParam,
  cursorParam,
  nextParam,
  previousParam,
  node,
  tsResolver,
  queryParam,
  queryKeyName,
}: Props): KubbReactNode {
  const successNames = resolveSuccessNames(node, tsResolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : tsResolver.resolveResponseName(node)
  const queryFnDataType = responseName
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

  const rawQueryParams = getOperationParameters(node, { paramsCasing: 'original' }).query
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

  const paramsNode = getQueryOptionsParams(node, { resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const queryFnBody = `const { data } = await ${buildClientCall(node, { clientName, signal: true })}
    return data`

  const queryKeyParamsNode = buildQueryKeyParams(node, { resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

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
      'getNextPageParam: (lastPage, _allPages, lastPageParam) => Array.isArray(lastPage) && lastPage.length === 0 ? undefined : lastPageParam + 1',
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
      ? `query = {
      ...(query ?? {}),
      ['${queryParam}']: pageParam as unknown as ${queryParamsTypeName}['${queryParam}'],
    } as ${queryParamsTypeName}`
      : ''

  if (infiniteOverrideParams) {
    return (
      <File.Source name={name} isExportable isIndexable>
        <Function name={name} export params={paramsSignature}>
          {`
const queryKey = ${queryKeyName}(${queryKeyParamsCall})
return infiniteQueryOptions<${queryFnDataType}, ${errorType}, InfiniteData<${queryFnDataType}>, typeof queryKey, ${pageParamType}>({
  queryKey,
  queryFn: async ({ signal, pageParam }) => {
    ${infiniteOverrideParams}
    ${queryFnBody}
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
return infiniteQueryOptions<${queryFnDataType}, ${errorType}, InfiniteData<${queryFnDataType}>, typeof queryKey, ${pageParamType}>({
  queryKey,
  queryFn: async ({ signal }) => {
    ${queryFnBody}
  },
  ${queryOptionsArr.join(',\n  ')}
})
`}
      </Function>
    </File.Source>
  )
}
