import { getNestedAccessor } from '@internals/utils'
import type { ast } from 'kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { Infinite } from '../types.ts'
import {
  buildCallResultBody,
  buildClientCall,
  buildGroupedRequestParam,
  buildQueryOptionsParams,
  buildResponseTypes,
  queryKeyGroupOrder,
  resolvePageParamType,
} from '../utils.ts'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  initialPageParam: Infinite['initialPageParam']
  hasExplicitInitialPageParam?: boolean
  cursorParam: Infinite['cursorParam']
  nextParam: Infinite['nextParam']
  previousParam: Infinite['previousParam']
  getNextPageParam?: Infinite['getNextPageParam']
  getPreviousPageParam?: Infinite['getPreviousPageParam']
  queryParam: Infinite['queryParam']
  /**
   * The `TQueryKey` generic written into the emitted `infiniteQueryOptions` call. react-query
   * points it at the local `queryKey` const, vue-query uses the imported `QueryKey` type.
   *
   * @default 'typeof queryKey'
   */
  queryKeyType?: string
  /**
   * Wraps each grouped request member type, used by vue-query to accept `MaybeRefOrGetter` values.
   */
  memberTypeWrapper?: (type: string) => string
  /**
   * Unwraps a request group inside the client call, used by vue-query to emit `toValue(...)`.
   */
  unwrapName?: (name: string) => string
  /**
   * The registered client plugin's `returnType`, read by the caller off `resolveClientOperation`.
   *
   * @default 'full'
   */
  returnType?: 'full' | 'data'
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function InfiniteQueryOptions({
  name,
  clientName,
  initialPageParam,
  hasExplicitInitialPageParam,
  cursorParam,
  nextParam,
  previousParam,
  getNextPageParam,
  getPreviousPageParam,
  node,
  tsResolver,
  queryParam,
  queryKeyName,
  queryKeyType = 'typeof queryKey',
  memberTypeWrapper,
  unwrapName,
  returnType = 'full',
}: Props): KubbReactNode {
  const { TData: queryFnDataType, TError: errorType } = buildResponseTypes(node, tsResolver)

  const { queryParamsTypeName, pageParamType } = resolvePageParamType(node, { resolver: tsResolver, initialPageParam, queryParam })

  const groupedKeyParam = buildGroupedRequestParam(node, { resolver: tsResolver, keys: queryKeyGroupOrder, memberTypeWrapper })
  const queryKeyParamsNode = createFunctionParameters({ params: groupedKeyParam ? [groupedKeyParam] : [] })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const paramsNode = buildQueryOptionsParams(node, { resolver: tsResolver, memberTypeWrapper })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const queryFnBody = buildCallResultBody(buildClientCall(node, { clientName, signal: true, unwrapName }), { returnType })

  const initialPageParamLiteral =
    typeof initialPageParam === 'string' || (typeof initialPageParam === 'object' && initialPageParam !== null)
      ? JSON.stringify(initialPageParam)
      : String(initialPageParam === undefined ? 0 : initialPageParam)

  // Resolve getNextPageParam: custom source > nextParam > cursorParam > default numeric fallback.
  // TanStack Query v5 requires getNextPageParam on infiniteQueryOptions.
  const serializedGetNextPageParam = typeof getNextPageParam === 'function' ? getNextPageParam.toString() : getNextPageParam
  const getNextPageParamExpr = (() => {
    if (serializedGetNextPageParam) return `getNextPageParam: ${serializedGetNextPageParam}`
    if (nextParam) return `getNextPageParam: (lastPage) => ${getNestedAccessor(nextParam, 'lastPage')}`
    if (cursorParam) return `getNextPageParam: (lastPage) => lastPage['${cursorParam}']`
    return 'getNextPageParam: (lastPage, _allPages, lastPageParam) => Array.isArray(lastPage) && lastPage.length === 0 ? undefined : lastPageParam + 1'
  })()

  // Resolve getPreviousPageParam: custom source > previousParam > cursorParam > default numeric fallback.
  // In TanStack Query, getPreviousPageParam is optional (only needed for bi-directional pagination).
  // When next pagination is custom or cursor-based, numeric decrement is omitted unless explicitly configured.
  // When initialPageParam is not explicitly configured, keep the legacy 1-based default (<= 1) for non-breaking compatibility.
  const serializedGetPreviousPageParam = typeof getPreviousPageParam === 'function' ? getPreviousPageParam.toString() : getPreviousPageParam
  const defaultPreviousThreshold = hasExplicitInitialPageParam ? initialPageParamLiteral : '1'

  const getPreviousPageParamExpr = (() => {
    if (serializedGetPreviousPageParam) return `getPreviousPageParam: ${serializedGetPreviousPageParam}`
    if (previousParam) return `getPreviousPageParam: (firstPage) => ${getNestedAccessor(previousParam, 'firstPage')}`
    if (cursorParam) return `getPreviousPageParam: (firstPage) => firstPage['${cursorParam}']`
    if (serializedGetNextPageParam || nextParam) return null
    return `getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => firstPageParam <= ${defaultPreviousThreshold} ? undefined : firstPageParam - 1`
  })()

  const queryOptionsArr = [`initialPageParam: ${initialPageParamLiteral}`, getNextPageParamExpr, getPreviousPageParamExpr].filter(Boolean)

  const infiniteOverrideParams =
    queryParam && queryParamsTypeName
      ? `query = {
      ...(query ?? {}),
      ['${queryParam}']: pageParam as unknown as ${queryParamsTypeName}['${queryParam}'],
    } as ${queryParamsTypeName}`
      : ''

  const queryFnArgs = infiniteOverrideParams ? '{ signal, pageParam }' : '{ signal }'
  const queryFnStatements = infiniteOverrideParams ? `${infiniteOverrideParams}\n    ${queryFnBody}` : queryFnBody

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature}>
        {`
const queryKey = ${queryKeyName}(${queryKeyParamsCall})
return infiniteQueryOptions<${queryFnDataType}, ${errorType}, InfiniteData<${queryFnDataType}>, ${queryKeyType}, ${pageParamType}>({
  queryKey,
  queryFn: async (${queryFnArgs}) => {
    ${queryFnStatements}
  },
  ${queryOptionsArr.join(',\n  ')}
})
`}
      </Function>
    </File.Source>
  )
}
