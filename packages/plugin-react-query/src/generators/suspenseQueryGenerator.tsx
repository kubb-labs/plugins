import { operationFileEntry, resolveOperationTypeNames } from '@internals/shared'
import { resolveClientOperation } from '@internals/client'
import { ast, defineGenerator } from 'kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
import { Query, QueryKey, QueryOptions } from '../components'
import { classifyOperation } from '../utils.ts'
import type { PluginReactQuery } from '../types'

/**
 * Built-in generator for `useSuspenseQuery` hooks. Enabled when
 * `pluginReactQuery({ suspense: {}, hooks: true })`. Emits one
 * `useFooSuspenseQuery` hook per query operation. Suspense queries throw
 * promises while loading and require a `<Suspense>` boundary in the React
 * tree. TanStack Query v5+ only.
 */
export const suspenseQueryGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-suspense-query',
  renderer: jsxRenderer,
  match(node, ctx) {
    const operationNode = node as ast.OperationNode
    if (!ast.isHttpOperationNode(operationNode)) return false
    const { query, mutation, suspense, hooks } = ctx.options
    const { isQuery, isMutation } = classifyOperation(operationNode, { query, mutation })
    return isQuery && !isMutation && !!suspense && hooks
  },
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, driver, resolver, root } = ctx
    const { output, query, client, group, customOptions } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = driver.getResolver(pluginTsName)

    const importPath = query ? query.importPath : '@tanstack/react-query'

    // The registered contract client plugin owns the `<op>` the hook imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output })
    if (!contractOp) return null

    const queryName = resolver.suspenseQuery.name(node)
    const queryOptionsName = resolver.suspenseQuery.optionsName(node)
    const queryKeyName = resolver.suspenseQuery.keyName(node)
    const queryKeyTypeName = resolver.suspenseQuery.keyTypeName(node)

    const meta = {
      file: resolver.file({ ...operationFileEntry(node, queryName), root, output, group: group ?? undefined }),
      fileTs: tsResolver.file({
        ...operationFileEntry(node, node.operationId),
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
    }

    const importedTypeNames = [
      tsResolver.response.options(node),
      ...resolveOperationTypeNames(node, tsResolver, {
        exclude: [queryKeyTypeName],
        order: 'body-response-first',
        includeParams: false,
      }),
    ].filter((name): name is string => Boolean(name))

    const calledClientName = contractOp.name

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name={[contractOp.name]} root={meta.file.path} path={contractOp.path} />
        <File.Import name={['RequestConfig', 'ResponseErrorConfig']} root={meta.file.path} path={contractOp.clientPath} isTypeOnly />

        {customOptions && <File.Import name={[customOptions.name]} path={customOptions.importPath} />}
        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <QueryKey name={queryKeyName} typeName={queryKeyTypeName} node={node} tsResolver={tsResolver} transformer={ctx.options.queryKey} />

        <File.Import name={['queryOptions']} path={importPath} />

        <QueryOptions name={queryOptionsName} clientName={calledClientName} queryKeyName={queryKeyName} node={node} tsResolver={tsResolver} />

        <File.Import name={['useSuspenseQuery']} path={importPath} />
        <File.Import name={['QueryKey', 'QueryClient', 'UseSuspenseQueryOptions', 'UseSuspenseQueryResult']} path={importPath} isTypeOnly />
        <Query
          name={queryName}
          queryOptionsName={queryOptionsName}
          queryKeyName={queryKeyName}
          queryKeyTypeName={queryKeyTypeName}
          node={node}
          tsResolver={tsResolver}
          customOptions={customOptions}
          suspense
        />
      </File>
    )
  },
})
