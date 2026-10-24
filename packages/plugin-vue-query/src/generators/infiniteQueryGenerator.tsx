import { resolveClientOperation, resolveTypeResolver } from '@internals/client'
import {
  classifyOperation,
  getDefaultPageParamsWarning,
  HookFile,
  InfiniteQueryOptions,
  matchesInfinite,
  QueryKey,
  resolveHookFile,
  resolvePageParamType,
} from '@internals/tanstack-query'
import { ast, defineGenerator } from 'kubb/kit'
import { File, jsxRenderer } from 'kubb/jsx'
import { Query } from '../components/Query.tsx'
import { maybeRefOrGetter } from '../utils.ts'
import type { PluginVueQuery } from '../types'

/**
 * Built-in generator for `useInfiniteQuery` composables. Enabled when
 * `pluginVueQuery({ infinite: { ... }, hooks: true })`. Emits one
 * `useFooInfiniteQuery` composable per query operation, wiring the
 * configured cursor path into TanStack Query's cursor-based pagination.
 */
export const infiniteQueryGenerator = defineGenerator<PluginVueQuery>({
  name: 'vue-query-infinite',
  renderer: jsxRenderer,
  match(node, ctx) {
    const operationNode = node as ast.OperationNode
    if (!ast.isHttpOperationNode(operationNode)) return false
    const { query, mutation, infinite, hooks } = ctx.options

    const { isQuery, isMutation } = classifyOperation(operationNode, { query, mutation })
    const infiniteOptions = infinite && typeof infinite === 'object' ? infinite : null
    if (!isQuery || isMutation || !infiniteOptions || !hooks) return false

    return matchesInfinite(operationNode, infiniteOptions)
  },
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { driver, resolver, root } = ctx
    const { output, query, infinite, client, group } = ctx.options

    const infiniteOptions = infinite && typeof infinite === 'object' ? infinite : null
    if (!infiniteOptions) return null

    const pageParamsWarning = getDefaultPageParamsWarning(node, infiniteOptions)
    if (pageParamsWarning) ctx.warn(pageParamsWarning)

    const importPath = query ? query.importPath : '@tanstack/vue-query'

    // The registered contract client plugin owns the `<op>` the composable imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output, cache: ctx.cache })
    if (!contractOp) return null

    const queryName = resolver.infiniteQuery.name(node)
    const queryOptionsName = resolver.infiniteQuery.optionsName(node)
    const queryKeyName = resolver.infiniteQuery.keyName(node)
    const queryKeyTypeName = resolver.infiniteQuery.keyTypeName(node)

    const hook = resolveHookFile(node, ctx, {
      name: queryName,
      output,
      group,
      contractOp,
      keyTypeName: queryKeyTypeName,
      extraTypeNames: [
        resolvePageParamType(node, {
          resolver: resolveTypeResolver(ctx.driver, ctx.resolver.pluginName).resolver,
          initialPageParam: infiniteOptions.initialPageParam,
          queryParam: infiniteOptions.queryParam,
        }).queryParamsTypeName,
      ],
    })
    const { tsResolver } = hook

    return (
      <HookFile
        hook={hook}
        imports={
          <>
            <File.Import name={['toValue']} path="vue" />
            <File.Import name={['MaybeRefOrGetter']} path="vue" isTypeOnly />
          </>
        }
      >
        <QueryKey
          name={queryKeyName}
          typeName={queryKeyTypeName}
          node={node}
          tsResolver={tsResolver}
          transformer={ctx.options.queryKey}
          variant="infiniteQuery"
          memberTypeWrapper={maybeRefOrGetter}
          exportType
        />

        <File.Import name={['InfiniteData']} isTypeOnly path={importPath} />
        <File.Import name={['infiniteQueryOptions']} path={importPath} />

        <InfiniteQueryOptions
          name={queryOptionsName}
          clientName={contractOp.name}
          queryKeyName={queryKeyName}
          node={node}
          tsResolver={tsResolver}
          cursorParam={infiniteOptions.cursorParam}
          nextParam={infiniteOptions.nextParam}
          previousParam={infiniteOptions.previousParam}
          getNextPageParam={infiniteOptions.getNextPageParam}
          getPreviousPageParam={infiniteOptions.getPreviousPageParam}
          initialPageParam={infiniteOptions.initialPageParam}
          hasExplicitInitialPageParam={infiniteOptions.hasExplicitInitialPageParam}
          queryParam={infiniteOptions.queryParam}
          returnType={contractOp.returnType}
          queryKeyType="QueryKey"
          memberTypeWrapper={maybeRefOrGetter}
          unwrapName={(name) => `toValue(${name})`}
        />

        <File.Import name={['useInfiniteQuery']} path={importPath} />
        <File.Import name={['QueryKey', 'QueryClient', 'UseInfiniteQueryOptions', 'UseInfiniteQueryReturnType']} path={importPath} isTypeOnly />

        <Query
          name={queryName}
          queryOptionsName={queryOptionsName}
          queryKeyName={queryKeyName}
          queryKeyTypeName={queryKeyTypeName}
          node={node}
          tsResolver={tsResolver}
          infinite
        />
      </HookFile>
    )
  },
})
