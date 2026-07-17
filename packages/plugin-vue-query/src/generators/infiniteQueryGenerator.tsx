import { getOperationParameters, operationFileEntry, resolveOperationTypeImports } from '@internals/shared'
import { resolveClientOperation } from '@internals/client'
import { classifyOperation, resolvePageParamType } from '@internals/tanstack-query'
import { ast, defineGenerator } from 'kubb/kit'
import { defaultOperationTypes, pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
import { InfiniteQuery, InfiniteQueryOptions, QueryKey } from '../components'
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
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, driver, resolver, root } = ctx
    const { output, query, mutation, infinite, client, group, hooks } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = driver.getResolver(pluginTsName)

    const { isQuery, isMutation } = classifyOperation(node, { query, mutation })
    const infiniteOptions = infinite && typeof infinite === 'object' ? infinite : null

    if (!isQuery || isMutation || !infiniteOptions || !hooks) return null

    // Validate queryParam exists in operation's query parameters
    const normalizeKey = (key: string) => key.replace(/\?$/, '')
    const queryParamKeys = getOperationParameters(node).query.map((p) => p.name)
    const hasQueryParam = infiniteOptions.queryParam ? queryParamKeys.some((k) => normalizeKey(k) === infiniteOptions.queryParam) : false
    // cursorParam validation against response schema keys is skipped in v5 (complex schema inspection)
    if (!hasQueryParam) return null

    const importPath = query ? query.importPath : '@tanstack/vue-query'

    // The registered contract client plugin owns the `<op>` the composable imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output })
    if (!contractOp) return null

    const queryName = resolver.infiniteQuery.name(node)
    const queryOptionsName = resolver.infiniteQuery.optionsName(node)
    const queryKeyName = resolver.infiniteQuery.keyName(node)
    const queryKeyTypeName = resolver.infiniteQuery.keyTypeName(node)

    const meta = {
      file: resolver.file({ ...operationFileEntry(node, queryName), root, output, group: group ?? undefined }),
      fileTs: tsResolver.file({
        ...operationFileEntry(node, node.operationId),
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
    }

    const { queryParamsTypeName } = resolvePageParamType(node, {
      resolver: tsResolver,
      initialPageParam: infiniteOptions.initialPageParam,
      queryParam: infiniteOptions.queryParam,
    })

    const typeImportGroups = meta.fileTs
      ? resolveOperationTypeImports(node, tsResolver, {
          exclude: [queryKeyTypeName],
          order: 'body-response-first',
          includeParams: false,
          operationTypes: pluginTs.options?.operationTypes ?? defaultOperationTypes,
          operationFilePath: meta.fileTs.path,
          root,
          output: pluginTs.options?.output ?? output,
          group: pluginTs.options?.group ?? undefined,
          extraNames: [tsResolver.response.options(node), queryParamsTypeName],
        })
      : []

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

        <File.Import name={['toValue']} path="vue" />
        <File.Import name={['MaybeRefOrGetter']} path="vue" isTypeOnly />

        {typeImportGroups.map((typeImport) => (
          <File.Import key={typeImport.path} name={typeImport.names} root={meta.file.path} path={typeImport.path} isTypeOnly />
        ))}

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

        <File.Import name={['useInfiniteQuery']} path={importPath} />
        <File.Import name={['QueryKey', 'QueryClient', 'UseInfiniteQueryOptions', 'UseInfiniteQueryReturnType']} path={importPath} isTypeOnly />

        <InfiniteQuery
          name={queryName}
          queryOptionsName={queryOptionsName}
          queryKeyName={queryKeyName}
          queryKeyTypeName={queryKeyTypeName}
          node={node}
          tsResolver={tsResolver}
          initialPageParam={infiniteOptions.initialPageParam}
          queryParam={infiniteOptions.queryParam}
        />
      </File>
    )
  },
})
