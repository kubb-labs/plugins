import { ast } from '@internals/ast'
import { resolveClientOperation, resolveOperationTypes } from '@internals/client'
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
import { defineGenerator } from '@kubb/kit'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Query } from '../components/Query.tsx'
import { QueryOptions } from '../components/QueryOptions.tsx'
import { hookFileVariants } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types'

type Variant = 'query' | 'suspenseQuery' | 'infiniteQuery' | 'suspenseInfiniteQuery'

const OBSERVER_IMPORTS: Record<Variant, Array<string>> = {
  query: ['QueryObserverOptions', 'UseQueryResult'],
  suspenseQuery: ['UseSuspenseQueryOptions', 'UseSuspenseQueryResult'],
  infiniteQuery: ['InfiniteQueryObserverOptions', 'UseInfiniteQueryResult'],
  suspenseInfiniteQuery: ['UseSuspenseInfiniteQueryOptions', 'UseSuspenseInfiniteQueryResult'],
}

/**
 * Builds the generator for one `useQuery` flavor. `variant` picks the resolver namespace
 * (`resolver.query`, `resolver.suspenseQuery`, ...), the TanStack hook, and the options it needs.
 */
export function createQueryGenerator({ name, variant }: { name: string; variant: Variant }) {
  const suspense = variant === 'suspenseQuery' || variant === 'suspenseInfiniteQuery'
  const infinite = variant === 'infiniteQuery' || variant === 'suspenseInfiniteQuery'
  const hookImport = `use${suspense ? 'Suspense' : ''}${infinite ? 'InfiniteQuery' : 'Query'}`
  const observerImports = OBSERVER_IMPORTS[variant]

  return defineGenerator<PluginReactQuery>({
    name,
    renderer: jsxRenderer,
    match(node, ctx) {
      const operationNode = node as ast.OperationNode
      if (!ast.http.isOperation(operationNode)) return false
      const { query, mutation, infinite: infiniteConfig, suspense: suspenseConfig, hooks } = ctx.options
      const { isQuery, isMutation } = classifyOperation(operationNode, { query, mutation })
      if (!isQuery || isMutation) return false
      if (suspense && !suspenseConfig) return false
      if (variant === 'query') return true
      if (!hooks) return false
      if (!infinite) return true

      const infiniteOptions = infiniteConfig && typeof infiniteConfig === 'object' ? infiniteConfig : null
      return !!infiniteOptions && matchesInfinite(operationNode, infiniteOptions)
    },
    operation(node, ctx) {
      if (!ast.http.isOperation(node)) return null
      const { query, infinite: infiniteConfig, client, customOptions, hooks } = ctx.options

      const infiniteOptions = infinite && infiniteConfig && typeof infiniteConfig === 'object' ? infiniteConfig : null
      if (infinite && !infiniteOptions) return null

      // The suspense infinite generator skips the warning: the infinite one already emits it for this operation.
      if (variant === 'infiniteQuery' && infiniteOptions) {
        const pageParamsWarning = getDefaultPageParamsWarning(node, infiniteOptions)
        if (pageParamsWarning) ctx.warn(pageParamsWarning)
      }

      const contractOp = resolveClientOperation({ node, pluginName: client.pluginName })
      if (!contractOp) return null

      const importPath = query ? query.importPath : '@tanstack/react-query'
      const variantResolver = ctx.resolver[variant]
      const queryName = variantResolver.name(node)
      const queryOptionsName = variantResolver.optionsName(node)
      const queryKeyName = variantResolver.keyName(node)
      const queryKeyTypeName = variantResolver.keyTypeName(node)
      const tsResolver = resolveOperationTypes().resolver

      const hook = resolveHookFile(node, {
        variant: hookFileVariants[variant],
        contractOp,
        returnType: ctx.options.returnType,
        keyTypeName: queryKeyTypeName,
        extraTypeNames: infiniteOptions
          ? [
              resolvePageParamType(node, { resolver: tsResolver, initialPageParam: infiniteOptions.initialPageParam, queryParam: infiniteOptions.queryParam })
                .queryParamsTypeName,
            ]
          : [],
      })

      return (
        <HookFile hook={hook} imports={customOptions && <File.Import names={[{ name: customOptions.name, space: 'value' }]} path={customOptions.importPath} />}>
          <QueryKey
            name={queryKeyName}
            typeName={queryKeyTypeName}
            node={node}
            tsResolver={hook.tsResolver}
            transformer={ctx.options.queryKey}
            variant={variant}
          />

          {infiniteOptions ? (
            <>
              <File.Import
                names={[
                  { name: 'infiniteQueryOptions', space: 'value' },
                  { name: 'InfiniteData', space: 'type' },
                ]}
                path={importPath}
              />
              <InfiniteQueryOptions
                name={queryOptionsName}
                clientName={contractOp.name}
                queryKeyName={queryKeyName}
                node={node}
                tsResolver={hook.tsResolver}
                cursorParam={infiniteOptions.cursorParam}
                nextParam={infiniteOptions.nextParam}
                previousParam={infiniteOptions.previousParam}
                getNextPageParam={infiniteOptions.getNextPageParam}
                getPreviousPageParam={infiniteOptions.getPreviousPageParam}
                initialPageParam={infiniteOptions.initialPageParam}
                hasExplicitInitialPageParam={infiniteOptions.hasExplicitInitialPageParam}
                queryParam={infiniteOptions.queryParam}
                clientReturnType={contractOp.returnType}
                returnType={hook.returnType}
                typedHeaders={hook.contractOp.typedHeaders}
              />
            </>
          ) : (
            <>
              <File.Import names={[{ name: 'queryOptions', space: 'value' }]} path={importPath} />
              <QueryOptions
                name={queryOptionsName}
                clientName={contractOp.name}
                queryKeyName={queryKeyName}
                node={node}
                tsResolver={hook.tsResolver}
                clientReturnType={contractOp.returnType}
                returnType={hook.returnType}
                typedHeaders={hook.contractOp.typedHeaders}
              />
            </>
          )}

          {(variant !== 'query' || (query && hooks)) && (
            <>
              <File.Import
                names={[
                  { name: hookImport, space: 'value' },
                  ...['QueryKey', 'QueryClient', ...observerImports].map((name) => ({ name, space: 'type' as const })),
                ]}
                path={importPath}
              />
              <Query
                name={queryName}
                queryOptionsName={queryOptionsName}
                queryKeyName={queryKeyName}
                queryKeyTypeName={queryKeyTypeName}
                node={node}
                tsResolver={hook.tsResolver}
                customOptions={customOptions}
                returnType={hook.returnType}
                typedHeaders={hook.contractOp.typedHeaders}
                suspense={suspense}
                infinite={infiniteOptions ? { initialPageParam: infiniteOptions.initialPageParam, queryParam: infiniteOptions.queryParam } : undefined}
              />
            </>
          )}
        </HookFile>
      )
    },
  })
}
