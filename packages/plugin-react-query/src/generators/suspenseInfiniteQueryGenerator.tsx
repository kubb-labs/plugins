import { getOperationParameters, operationFileEntry, resolveDependencyOperationFile, resolveOperationTypeNames } from '@internals/shared'
import { resolveClientOperation } from '@internals/client'
import { ast, defineGenerator } from 'kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
import { InfiniteQuery, InfiniteQueryOptions, QueryKey } from '../components'
import { classifyOperation } from '../utils.ts'
import type { PluginReactQuery } from '../types'

/**
 * Built-in generator for `useSuspenseInfiniteQuery` hooks. Enabled when
 * `suspense`, `infinite`, and `hooks` are all configured. Combines suspense
 * semantics with cursor-based pagination. Handlers throw promises while
 * loading and pull additional pages on demand.
 */
export const suspenseInfiniteQueryGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-suspense-infinite-query',
  renderer: jsxRenderer,
  match(node, ctx) {
    const operationNode = node as ast.OperationNode
    if (!ast.isHttpOperationNode(operationNode)) return false
    const { query, mutation, infinite, suspense, hooks } = ctx.options

    const { isQuery, isMutation } = classifyOperation(operationNode, { query, mutation })
    const infiniteOptions = infinite && typeof infinite === 'object' ? infinite : null
    if (!isQuery || isMutation || !suspense || !infiniteOptions || !hooks) return false

    // Validate queryParam exists in operation's query parameters, optional or not
    const queryParamKeys = getOperationParameters(operationNode).query.map((p) => p.name)
    return infiniteOptions.queryParam ? queryParamKeys.includes(infiniteOptions.queryParam) || queryParamKeys.includes(`${infiniteOptions.queryParam}?`) : false
  },
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, driver, resolver, root } = ctx
    const { output, query, infinite, client, group, customOptions } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = driver.getResolver(pluginTsName)

    const infiniteOptions = infinite && typeof infinite === 'object' ? infinite : null
    if (!infiniteOptions) return null

    const importPath = query ? query.importPath : '@tanstack/react-query'

    // The registered contract client plugin owns the `<op>` the hook imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output, cache: ctx.cache })
    if (!contractOp) return null

    const queryName = resolver.suspenseInfiniteQuery.name(node)
    const queryOptionsName = resolver.suspenseInfiniteQuery.optionsName(node)
    const queryKeyName = resolver.suspenseInfiniteQuery.keyName(node)
    const queryKeyTypeName = resolver.suspenseInfiniteQuery.keyTypeName(node)

    const meta = {
      file: resolver.file({ ...operationFileEntry(node, queryName), root, output, group: group ?? undefined }),
      fileTs: resolveDependencyOperationFile({
        cache: ctx.cache,
        node,
        resolver: tsResolver,
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group,
      }),
    }

    const rawQueryParams = getOperationParameters(node).query
    const queryParamsTypeName =
      rawQueryParams.length > 0 && tsResolver.param.query(node, rawQueryParams[0]!) !== tsResolver.param.name(node, rawQueryParams[0]!)
        ? tsResolver.param.query(node, rawQueryParams[0]!)
        : null

    const importedTypeNames = [
      tsResolver.response.options(node),
      queryParamsTypeName,
      ...resolveOperationTypeNames(node, tsResolver, { order: 'body-response-first', includeParams: false }),
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

        <File.Import name={['InfiniteData']} isTypeOnly path={importPath} />
        <File.Import name={['infiniteQueryOptions']} path={importPath} />

        <InfiniteQueryOptions
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

        <File.Import name={['useSuspenseInfiniteQuery']} path={importPath} />
        <File.Import name={['QueryKey', 'QueryClient', 'UseSuspenseInfiniteQueryOptions', 'UseSuspenseInfiniteQueryResult']} path={importPath} isTypeOnly />

        <InfiniteQuery
          name={queryName}
          queryOptionsName={queryOptionsName}
          queryKeyName={queryKeyName}
          queryKeyTypeName={queryKeyTypeName}
          node={node}
          tsResolver={tsResolver}
          initialPageParam={infiniteOptions.initialPageParam}
          queryParam={infiniteOptions.queryParam}
          customOptions={customOptions}
          suspense
        />
      </File>
    )
  },
})
