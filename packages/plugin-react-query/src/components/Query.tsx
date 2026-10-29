import type { ast } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import { buildClientOptionType, buildOperationComments } from '@internals/shared'
import {
  buildHookParams,
  buildResolvedRequestParams,
  buildResponseTypes,
  hasQueryKeyParams,
  maybeValueOrGetter,
  resolvePageParamType,
} from '@internals/tanstack-query'
import type { Infinite } from '@internals/tanstack-query'
import type { PluginReactQuery } from '../types.ts'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  customOptions: PluginReactQuery['resolvedOptions']['customOptions']
  /**
   * Emits the suspense variant of the hook (`useSuspenseQuery`, `useSuspenseInfiniteQuery`). The
   * suspense observer options drop the `TQueryData` generic, everything else stays identical.
   */
  suspense?: boolean
  /**
   * Emits the infinite variant of the hook (`useInfiniteQuery`) with the page param type resolved from these.
   */
  infinite?: {
    initialPageParam: Infinite['initialPageParam']
    queryParam?: Infinite['queryParam']
  }
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })

const OBSERVER_OPTIONS_NAMES = {
  infinite: { suspense: 'UseSuspenseInfiniteQueryOptions', standard: 'InfiniteQueryObserverOptions' },
  plain: { suspense: 'UseSuspenseQueryOptions', standard: 'QueryObserverOptions' },
}

type HookTypesProps = Pick<Props, 'node' | 'suspense' | 'queryKeyTypeName' | 'infinite'> & {
  tsResolver: ResolverTs
  TData: string
  TError: string
  observerOptionsName: string
  resultTypeName: string
}

function buildHookTypes({ node, tsResolver, infinite, suspense, TData, TError, queryKeyTypeName, observerOptionsName, resultTypeName }: HookTypesProps) {
  if (infinite) {
    const { pageParamType } = resolvePageParamType(node, { resolver: tsResolver, initialPageParam: infinite.initialPageParam, queryParam: infinite.queryParam })
    return {
      generics: [
        `TQueryFnData = ${TData}`,
        `TError = ${TError}`,
        'TData = InfiniteData<TQueryFnData>',
        `TQueryKey extends QueryKey = ${queryKeyTypeName}`,
        `TPageParam = ${pageParamType}`,
      ],
      observerOptionsType: `${observerOptionsName}<TQueryFnData, TError, TData, TQueryKey, TPageParam>`,
      returnType: `${resultTypeName}<TData, TError> & { queryKey: TQueryKey }`,
    }
  }

  return {
    generics: suspense
      ? [`TData = ${TData}`, `TQueryKey extends QueryKey = ${queryKeyTypeName}`]
      : [`TData = ${TData}`, `TQueryData = ${TData}`, `TQueryKey extends QueryKey = ${queryKeyTypeName}`],
    observerOptionsType: `${observerOptionsName}<${(suspense ? [TData, TError, 'TData', 'TQueryKey'] : [TData, TError, 'TData', 'TQueryData', 'TQueryKey']).join(', ')}>`,
    returnType: `${resultTypeName}<TData, ${TError}> & { queryKey: TQueryKey }`,
  }
}

export function Query({ name, queryKeyTypeName, queryOptionsName, queryKeyName, node, tsResolver, customOptions, suspense, infinite }: Props): KubbReactNode {
  const { TData, TError } = buildResponseTypes(node, tsResolver)

  const prefix = suspense ? 'UseSuspense' : 'Use'
  const hookName = `${suspense ? 'useSuspense' : 'use'}${infinite ? 'InfiniteQuery' : 'Query'}`
  const observerOptionsName = OBSERVER_OPTIONS_NAMES[infinite ? 'infinite' : 'plain'][suspense ? 'suspense' : 'standard']
  const resultTypeName = `${prefix}${infinite ? 'Infinite' : ''}QueryResult`

  const { generics, observerOptionsType, returnType } = buildHookTypes({
    node,
    tsResolver,
    infinite,
    suspense,
    TData,
    TError,
    queryKeyTypeName,
    observerOptionsName,
    resultTypeName,
  })
  // The non-infinite hook casts to the bare options type, the infinite one to the fully applied type.
  const castType = infinite ? observerOptionsType : observerOptionsName

  const resolvedParams = buildResolvedRequestParams(node)
  const queryKeyArgs = resolvedParams && hasQueryKeyParams(node) ? 'resolvedParams' : ''
  const queryOptionsArgs = resolvedParams ? 'resolvedParams, config' : 'config'

  const paramsNode = buildHookParams(node, {
    resolver: tsResolver,
    memberTypeWrapper: maybeValueOrGetter,
    optionsType: `{
  query?: Partial<${observerOptionsType}> & { client?: QueryClient },
  client?: ${buildClientOptionType()}
}`,
  })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        name={name}
        export
        generics={generics.join(', ')}
        params={paramsSignature}
        returnType={undefined}
        JSDoc={{ comments: buildOperationComments(node) }}
      >
        {`
       const { query: queryConfig = {}, client: config = {} } = options ?? {}
       const { client: queryClient, ...resolvedOptions } = queryConfig${resolvedParams ? `\n       const resolvedParams = ${resolvedParams}` : ''}
       const queryKey = resolvedOptions?.queryKey ?? ${queryKeyName}(${queryKeyArgs})${customOptions ? `\n       const customOptions = ${customOptions.name}({ hookName: '${name}', operationId: '${node.operationId}' })` : ''}

       const queryResult = ${hookName}({
        ...${queryOptionsName}(${queryOptionsArgs}),${customOptions ? '\n        ...customOptions,' : ''}
        ...resolvedOptions,
        queryKey,
       } as unknown as ${castType}, queryClient) as ${returnType}

       queryResult.queryKey = queryKey as TQueryKey

       return queryResult
       `}
      </Function>
    </File.Source>
  )
}
