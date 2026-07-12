import { getNestedAccessor } from '@internals/utils'
import type { ast } from 'kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { createFunctionParameters, functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'
import type { Infinite } from '../types.ts'
import { buildClientCall, buildGroupedRequestParam, buildQueryOptionsParams, buildResponseTypes, resolvePageParamType } from '../utils.ts'

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
  queryParam,
  queryKeyName,
  queryKeyType = 'typeof queryKey',
  memberTypeWrapper,
  unwrapName,
}: Props): KubbReactNode {
  const { TData: queryFnDataType, TError: errorType } = buildResponseTypes(node, tsResolver)

  const { queryParamsTypeName, pageParamType } = resolvePageParamType(node, { resolver: tsResolver, initialPageParam, queryParam })

  const groupedKeyParam = buildGroupedRequestParam(node, { resolver: tsResolver, keys: ['path', 'query', 'body'], memberTypeWrapper })
  const queryKeyParamsNode = createFunctionParameters({ params: groupedKeyParam ? [groupedKeyParam] : [] })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const paramsNode = buildQueryOptionsParams(node, { resolver: tsResolver, memberTypeWrapper })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const queryFnBody = `const { data } = await ${buildClientCall(node, { clientName, signal: true, unwrapName })}
    return data`

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
return infiniteQueryOptions<${queryFnDataType}, ${errorType}, InfiniteData<${queryFnDataType}>, ${queryKeyType}, ${pageParamType}>({
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
return infiniteQueryOptions<${queryFnDataType}, ${errorType}, InfiniteData<${queryFnDataType}>, ${queryKeyType}, ${pageParamType}>({
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
