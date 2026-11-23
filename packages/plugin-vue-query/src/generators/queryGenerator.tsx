import { ast } from '@internals/ast'
import { resolveClientOperation } from '@internals/client'
import { classifyOperation, HookFile, QueryKey, resolveHookFile } from '@internals/tanstack-query'
import { defineTemplate } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import { Query } from '../components/Query.tsx'
import { QueryOptions } from '../components/QueryOptions.tsx'
import { maybeRefOrGetter } from '../utils.ts'
import type { PluginVueQuery } from '../types'

/**
 * Built-in template for `useQuery` composables. Emits one `useFooQuery`
 * composable per GET and QUERY operation (configurable via `query.methods`) plus the
 * matching `fooQueryKey` / `fooQueryOptions` helpers.
 */
export const queryOperation = defineTemplate<PluginVueQuery>({
  kind: 'Operation',
  render(node, ctx) {
    if (!ast.http.isOperation(node)) return null
    const { query, mutation, client, hooks } = ctx.options

    const { isQuery, isMutation } = classifyOperation(node, { query, mutation })

    if (!isQuery || isMutation) return null

    const importPath = query ? query.importPath : '@tanstack/vue-query'

    // The registered contract client plugin owns the `<op>` the composable imports and calls.
    const contractOp = resolveClientOperation({ node, pluginName: client.pluginName })
    if (!contractOp) return null

    const queryName = ctx.resolver.query.name(node)
    const queryOptionsName = ctx.resolver.query.optionsName(node)
    const queryKeyName = ctx.resolver.query.keyName(node)
    const queryKeyTypeName = ctx.resolver.query.keyTypeName(node)

    const hook = resolveHookFile(node, { contractOp, keyTypeName: queryKeyTypeName, returnType: ctx.options.returnType })
    const { tsResolver } = hook

    return (
      <HookFile
        hook={hook}
        imports={
          <>
            <File.Import names={[{ name: 'toValue' }]} path="vue" />
            <File.Import names={[{ name: 'MaybeRefOrGetter', space: 'type' }]} path="vue" />
          </>
        }
      >
        <QueryKey
          name={queryKeyName}
          typeName={queryKeyTypeName}
          node={node}
          tsResolver={tsResolver}
          transformer={ctx.options.queryKey}
          variant="query"
          memberTypeWrapper={maybeRefOrGetter}
          exportType
        />

        <File.Import names={[{ name: 'queryOptions' }]} path={importPath} />

        <QueryOptions
          name={queryOptionsName}
          clientName={contractOp.name}
          queryKeyName={queryKeyName}
          node={node}
          tsResolver={tsResolver}
          clientReturnType={contractOp.returnType}
          returnType={hook.returnType}
          typedHeaders={hook.contractOp.typedHeaders}
        />

        {query && hooks && (
          <>
            <File.Import names={[{ name: 'useQuery' }]} path={importPath} />
            <File.Import
              names={[
                { name: 'QueryKey', space: 'type' },
                { name: 'QueryClient', space: 'type' },
                { name: 'UseQueryOptions', space: 'type' },
                { name: 'UseQueryReturnType', space: 'type' },
              ]}
              path={importPath}
            />
            <Query
              name={queryName}
              queryOptionsName={queryOptionsName}
              queryKeyName={queryKeyName}
              queryKeyTypeName={queryKeyTypeName}
              node={node}
              tsResolver={tsResolver}
              returnType={hook.returnType}
              typedHeaders={hook.contractOp.typedHeaders}
            />
          </>
        )}
      </HookFile>
    )
  },
})
