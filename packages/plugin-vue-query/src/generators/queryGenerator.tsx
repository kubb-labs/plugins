import { resolveClientOperation } from '@internals/client'
import { classifyOperation, HookFile, QueryKey, resolveHookFile } from '@internals/tanstack-query'
import { ast, defineGenerator } from 'kubb/kit'
import { File, jsxRenderer } from 'kubb/jsx'
import { Query } from '../components/Query.tsx'
import { QueryOptions } from '../components/QueryOptions.tsx'
import { maybeRefOrGetter } from '../utils.ts'
import type { PluginVueQuery } from '../types'

/**
 * Built-in generator for `useQuery` composables. Emits one `useFooQuery`
 * composable per GET and QUERY operation (configurable via `query.methods`) plus the
 * matching `fooQueryKey` / `fooQueryOptions` helpers.
 */
export const queryGenerator = defineGenerator<PluginVueQuery>({
  name: 'vue-query',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { driver, resolver, root } = ctx
    const { output, query, mutation, client, group, hooks } = ctx.options

    const { isQuery, isMutation } = classifyOperation(node, { query, mutation })

    if (!isQuery || isMutation) return null

    const importPath = query ? query.importPath : '@tanstack/vue-query'

    // The registered contract client plugin owns the `<op>` the composable imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output, memo: ctx.memo })
    if (!contractOp) return null

    const queryName = resolver.query.name(node)
    const queryOptionsName = resolver.query.optionsName(node)
    const queryKeyName = resolver.query.keyName(node)
    const queryKeyTypeName = resolver.query.keyTypeName(node)

    const hook = resolveHookFile(node, ctx, { name: queryName, output, group, contractOp, keyTypeName: queryKeyTypeName })
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
          variant="query"
          memberTypeWrapper={maybeRefOrGetter}
          exportType
        />

        <File.Import name={['queryOptions']} path={importPath} />

        <QueryOptions
          name={queryOptionsName}
          clientName={contractOp.name}
          queryKeyName={queryKeyName}
          node={node}
          tsResolver={tsResolver}
          returnType={contractOp.returnType}
        />

        {query && hooks && (
          <>
            <File.Import name={['useQuery']} path={importPath} />
            <File.Import name={['QueryKey', 'QueryClient', 'UseQueryOptions', 'UseQueryReturnType']} path={importPath} isTypeOnly />
            <Query
              name={queryName}
              queryOptionsName={queryOptionsName}
              queryKeyName={queryKeyName}
              queryKeyTypeName={queryKeyTypeName}
              node={node}
              tsResolver={tsResolver}
            />
          </>
        )}
      </HookFile>
    )
  },
})
