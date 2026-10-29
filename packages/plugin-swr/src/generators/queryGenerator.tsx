import { resolveClientOperation } from '@internals/client'
import { classifyOperation, HookFile, QueryKey, resolveHookFile } from '@internals/tanstack-query'
import { ast, defineGenerator } from 'kubb/kit'
import { File, jsxRenderer } from 'kubb/jsx'
import { Query } from '../components/Query.tsx'
import { QueryOptions } from '../components/QueryOptions.tsx'
import type { PluginSwr } from '../types'

/**
 * Built-in generator for `useSWR` hooks. Emits one `useFoo` hook per read operation plus the
 * matching `fooQueryKey` helper and `fooQueryOptions` factory.
 */
export const queryGenerator = defineGenerator<PluginSwr>({
  name: 'swr-query',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { driver, resolver, root } = ctx
    const { output, query, mutation, client, group } = ctx.options

    const { isQuery } = classifyOperation(node, { query, mutation })

    if (!isQuery) return null

    const importPath = query ? query.importPath : 'swr'

    // The registered contract client plugin owns the `<op>` the hook imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output, memo: ctx.memo })
    if (!contractOp) return null

    const queryName = resolver.query.name(node)
    const queryOptionsName = resolver.query.optionsName(node)
    const queryKeyName = resolver.query.keyName(node)
    const queryKeyTypeName = resolver.query.keyTypeName(node)

    const hook = resolveHookFile(node, ctx, { name: queryName, output, group, contractOp, keyTypeName: queryKeyTypeName })
    const { tsResolver } = hook

    return (
      <HookFile hook={hook}>
        <QueryKey name={queryKeyName} typeName={queryKeyTypeName} node={node} tsResolver={tsResolver} transformer={ctx.options.queryKey} variant="query" />

        <QueryOptions name={queryOptionsName} clientName={contractOp.name} node={node} tsResolver={tsResolver} returnType={contractOp.returnType} />

        {query && (
          <>
            <File.Import name={'useSWR'} path={importPath} />
            <File.Import name={['SWRConfiguration']} path={importPath} isTypeOnly />
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
