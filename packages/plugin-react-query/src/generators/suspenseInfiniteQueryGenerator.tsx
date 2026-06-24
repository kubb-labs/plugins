import { getOperationParameters, operationFileEntry, resolveOperationTypeImports } from '@internals/shared'
import { resolveClientOperation } from '@internals/client'
import { resolveZodSchemaNames } from '@internals/tanstack-query'
import { ast, defineGenerator } from '@kubb/core'
import { isParserEnabled } from '@internals/client'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { QueryKey, SuspenseInfiniteQuery, SuspenseInfiniteQueryOptions } from '../components'
import type { PluginReactQuery } from '../types'

/**
 * Built-in generator for `useSuspenseInfiniteQuery` hooks. Enabled when both
 * `suspense` and `infinite` are configured. Combines suspense semantics with
 * cursor-based pagination — handlers throw promises while loading and pull
 * additional pages on demand.
 */
export const suspenseInfiniteQueryGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-suspense-infinite-query',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, driver, resolver, root } = ctx
    const { output, query, mutation, infinite, suspense, parser, client, group, customOptions } = ctx.options

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
      file: resolver.resolveFile(operationFileEntry(node, queryName), { root, output, group: group ?? undefined }),
      fileTs: tsResolver.resolveFile(operationFileEntry(node, node.operationId), {
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
    }

    const rawQueryParams = getOperationParameters(node, { paramsCasing: 'original' }).query
    const queryParamsTypeName =
      rawQueryParams.length > 0 && tsResolver.resolveQueryParamsName(node, rawQueryParams[0]!) !== tsResolver.resolveParamName(node, rawQueryParams[0]!)
        ? tsResolver.resolveQueryParamsName(node, rawQueryParams[0]!)
        : null

    const typeImports = resolveOperationTypeImports(node, tsResolver, {
      order: 'body-response-first',
      includeParams: false,
      extraOperationFileNames: [tsResolver.resolveRequestConfigName(node), queryParamsTypeName ?? undefined],
      operationFilePath: meta.fileTs.path,
      fileContext: { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group ?? undefined },
    })

    const pluginZod = isParserEnabled(parser) ? driver.getPlugin(pluginZodName) : null
    const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : null
    const fileZod = zodResolver
      ? zodResolver.resolveFile(operationFileEntry(node, node.operationId), {
          root,
          output: pluginZod?.options?.output ?? output,
          group: pluginZod?.options?.group ?? undefined,
        })
      : null
    const zodSchemaNames = resolveZodSchemaNames(node, zodResolver, parser)

    const calledClientName = contractOp.name

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        {fileZod && zodSchemaNames.length > 0 && <File.Import name={zodSchemaNames} root={meta.file.path} path={fileZod.path} />}

        <File.Import name={[contractOp.name]} root={meta.file.path} path={contractOp.path} />
        <File.Import name={['RequestConfig', 'ResponseErrorConfig']} root={meta.file.path} path={contractOp.clientPath} isTypeOnly />

        {customOptions && <File.Import name={[customOptions.name]} path={customOptions.importPath} />}
        {typeImports.map((imp) => (
          <File.Import key={imp.path} name={imp.names} root={meta.file.path} path={imp.path} isTypeOnly />
        ))}

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
      </File>
    )
  },
})
