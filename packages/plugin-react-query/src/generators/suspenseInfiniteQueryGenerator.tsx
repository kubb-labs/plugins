import { getOperationParameters, operationFileEntry, resolveOperationTypeNames } from '@internals/shared'
import { resolveClientOperation } from '@internals/client'
import { ast, defineGenerator } from 'kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
import { QueryKey, SuspenseInfiniteQuery, SuspenseInfiniteQueryOptions } from '../components'
import type { PluginReactQuery } from '../types'

/**
 * Built-in generator for `useSuspenseInfiniteQuery` hooks. Enabled when both
 * `suspense` and `infinite` are configured. Combines suspense semantics with
 * cursor-based pagination. Handlers throw promises while loading and pull
 * additional pages on demand.
 */
export const suspenseInfiniteQueryGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-suspense-infinite-query',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, driver, resolver, root } = ctx
    const { output, query, mutation, infinite, suspense, client, group, customOptions, hooks } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = driver.getResolver(pluginTsName)

    const isQuery = query === false || (!!query && query.methods.some((method) => node.method.toLowerCase() === method.toLowerCase()))
    const queryMethods = new Set(query ? query.methods : [])
    const isMutation =
      mutation !== false &&
      !isQuery &&
      (mutation ? mutation.methods : []).some((method) => !queryMethods.has(method) && node.method.toLowerCase() === method.toLowerCase())
    const isSuspense = !!suspense
    const infiniteOptions = infinite && typeof infinite === 'object' ? infinite : null

    if (!isQuery || isMutation || !isSuspense || !infiniteOptions) return null

    // Validate queryParam exists in operation's query parameters
    const normalizeKey = (key: string) => key.replace(/\?$/, '')
    const queryParamKeys = getOperationParameters(node, { paramsCasing: 'original' }).query.map((p) => p.name)
    const hasQueryParam = infiniteOptions.queryParam ? queryParamKeys.some((k) => normalizeKey(k) === infiniteOptions.queryParam) : false
    const hasCursorParam = !infiniteOptions.cursorParam || true

    if (!hasQueryParam || !hasCursorParam) return null

    const importPath = query ? query.importPath : '@tanstack/react-query'

    // The registered contract client plugin owns the `<op>` the hook imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output })
    if (!contractOp) return null

    const queryName = resolver.resolveSuspenseInfiniteQueryName(node)
    const queryOptionsName = resolver.resolveSuspenseInfiniteQueryOptionsName(node)
    const queryKeyName = resolver.resolveSuspenseInfiniteQueryKeyName(node)
    const queryKeyTypeName = resolver.resolveSuspenseInfiniteQueryKeyTypeName(node)

    const meta = {
      file: resolver.core.file(operationFileEntry(node, queryName), { root, output, group: group ?? undefined }),
      fileTs: tsResolver.core.file(operationFileEntry(node, node.operationId), {
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
    }

    const rawQueryParams = getOperationParameters(node, { paramsCasing: 'original' }).query
    const queryParamsTypeName =
      rawQueryParams.length > 0 && tsResolver.resolveQueryName(node, rawQueryParams[0]!) !== tsResolver.resolveParamName(node, rawQueryParams[0]!)
        ? tsResolver.resolveQueryName(node, rawQueryParams[0]!)
        : null

    const importedTypeNames = [
      tsResolver.resolveRequestConfigName(node),
      queryParamsTypeName,
      ...resolveOperationTypeNames(node, tsResolver, { order: 'body-response-first', includeParams: false }),
    ].filter((name): name is string => Boolean(name))

    const calledClientName = contractOp.name

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.core.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.core.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name={[contractOp.name]} root={meta.file.path} path={contractOp.path} />
        <File.Import name={['RequestConfig', 'ResponseErrorConfig']} root={meta.file.path} path={contractOp.clientPath} isTypeOnly />

        {customOptions && <File.Import name={[customOptions.name]} path={customOptions.importPath} />}
        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <QueryKey name={queryKeyName} typeName={queryKeyTypeName} node={node} tsResolver={tsResolver} transformer={ctx.options.queryKey} />

        <File.Import name={['InfiniteData']} isTypeOnly path={importPath} />
        <File.Import name={['infiniteQueryOptions']} path={importPath} />

        <SuspenseInfiniteQueryOptions
          name={queryOptionsName}
          clientName={calledClientName}
          queryKeyName={queryKeyName}
          node={node}
          tsResolver={tsResolver}
          cursorParam={infiniteOptions.cursorParam}
          nextParam={infiniteOptions.nextParam}
          previousParam={infiniteOptions.previousParam}
          initialPageParam={infiniteOptions.initialPageParam}
          queryParam={infiniteOptions.queryParam}
        />

        {hooks && (
          <>
            <File.Import name={['useSuspenseInfiniteQuery']} path={importPath} />
            <File.Import name={['QueryKey', 'QueryClient', 'UseSuspenseInfiniteQueryOptions', 'UseSuspenseInfiniteQueryResult']} path={importPath} isTypeOnly />

            <SuspenseInfiniteQuery
              name={queryName}
              queryOptionsName={queryOptionsName}
              queryKeyName={queryKeyName}
              queryKeyTypeName={queryKeyTypeName}
              node={node}
              tsResolver={tsResolver}
              initialPageParam={infiniteOptions.initialPageParam}
              queryParam={infiniteOptions.queryParam}
              customOptions={customOptions}
            />
          </>
        )}
      </File>
    )
  },
})
