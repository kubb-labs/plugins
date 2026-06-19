import path from 'node:path'
import { getOperationParameters, operationFileEntry, resolveOperationTypeNames } from '@internals/shared'
import { resolveZodSchemaNames } from '@internals/tanstack-query'
import { ast, defineGenerator } from '@kubb/core'
import { Client, isParserEnabled, pluginClientName } from '@kubb/plugin-client'
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
    const { output, query, mutation, infinite, suspense, parser, client: clientOptions, group, customOptions } = ctx.options

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
    const queryParamKeys = getOperationParameters(node).query.map((p) => p.name)
    const hasQueryParam = infiniteOptions.queryParam ? queryParamKeys.some((k) => normalizeKey(k) === infiniteOptions.queryParam) : false
    const hasCursorParam = !infiniteOptions.cursorParam || true

    if (!hasQueryParam || !hasCursorParam) return null

    const importPath = query ? query.importPath : '@tanstack/react-query'

    const queryName = resolver.resolveSuspenseInfiniteQueryName(node)
    const queryOptionsName = resolver.resolveSuspenseInfiniteQueryOptionsName(node)
    const queryKeyName = resolver.resolveSuspenseInfiniteQueryKeyName(node)
    const queryKeyTypeName = resolver.resolveSuspenseInfiniteQueryKeyTypeName(node)
    const clientBaseName = resolver.resolveSuspenseInfiniteClientName(node)

    const meta = {
      file: resolver.resolveFile(operationFileEntry(node, queryName), { root, output, group: group ?? undefined }),
      fileTs: tsResolver.resolveFile(operationFileEntry(node, node.operationId), {
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
    }

    const rawQueryParams = getOperationParameters(node).query
    const queryParamsTypeName =
      rawQueryParams.length > 0 && tsResolver.resolveQueryParamsName(node, rawQueryParams[0]!) !== tsResolver.resolveParamName(node, rawQueryParams[0]!)
        ? tsResolver.resolveQueryParamsName(node, rawQueryParams[0]!)
        : null

    const importedTypeNames = [
      tsResolver.resolveRequestConfigName(node),
      queryParamsTypeName,
      ...resolveOperationTypeNames(node, tsResolver, { paramsCasing: 'camelcase', order: 'body-response-first', includeParams: false }),
    ].filter((name): name is string => Boolean(name))

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

    const clientPlugin = driver.getPlugin(pluginClientName)
    const hasClientPlugin = clientPlugin?.name === pluginClientName
    const shouldUseClientPlugin = hasClientPlugin && clientOptions.clientType !== 'class'
    const clientResolver = shouldUseClientPlugin ? driver.getResolver(pluginClientName) : null

    const clientFile = shouldUseClientPlugin
      ? clientResolver?.resolveFile(operationFileEntry(node, node.operationId), {
          root,
          output: clientPlugin?.options?.output ?? output,
          group: clientPlugin?.options?.group ?? undefined,
        })
      : null

    const resolvedClientName = shouldUseClientPlugin ? (clientResolver?.resolveName(node.operationId) ?? clientBaseName) : clientBaseName

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        {fileZod && zodSchemaNames.length > 0 && <File.Import name={zodSchemaNames} root={meta.file.path} path={fileZod.path} />}
        {clientOptions.importPath ? (
          <>
            {!shouldUseClientPlugin && <File.Import name={'client'} path={clientOptions.importPath} />}
            <File.Import name={['Client', 'RequestConfig', 'ResponseErrorConfig']} path={clientOptions.importPath} isTypeOnly />
          </>
        ) : (
          <>
            {!shouldUseClientPlugin && <File.Import name={['client']} root={meta.file.path} path={path.resolve(root, '.kubb/client.ts')} />}
            <File.Import
              name={['Client', 'RequestConfig', 'ResponseErrorConfig']}
              root={meta.file.path}
              path={path.resolve(root, '.kubb/client.ts')}
              isTypeOnly
            />
          </>
        )}
        {shouldUseClientPlugin && clientFile && <File.Import name={[resolvedClientName]} root={meta.file.path} path={clientFile.path} />}
        {!shouldUseClientPlugin && <File.Import name={['buildFormData']} root={meta.file.path} path={path.resolve(root, '.kubb/config.ts')} />}
        {customOptions && <File.Import name={[customOptions.name]} path={customOptions.importPath} />}
        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <QueryKey name={queryKeyName} typeName={queryKeyTypeName} node={node} tsResolver={tsResolver} transformer={ctx.options.queryKey} />

        {!shouldUseClientPlugin && (
          <Client
            name={resolvedClientName}
            baseURL={clientOptions.baseURL}
            dataReturnType={clientOptions.dataReturnType || 'data'}
            parser={parser}
            node={node}
            tsResolver={tsResolver}
            zodResolver={zodResolver}
          />
        )}

        <File.Import name={['InfiniteData']} isTypeOnly path={importPath} />
        <File.Import name={['infiniteQueryOptions']} path={importPath} />

        <SuspenseInfiniteQueryOptions
          name={queryOptionsName}
          clientName={resolvedClientName}
          queryKeyName={queryKeyName}
          node={node}
          tsResolver={tsResolver}
          dataReturnType={clientOptions.dataReturnType || 'data'}
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
          dataReturnType={clientOptions.dataReturnType || 'data'}
          initialPageParam={infiniteOptions.initialPageParam}
          queryParam={infiniteOptions.queryParam}
          customOptions={customOptions}
        />
      </File>
    )
  },
})
