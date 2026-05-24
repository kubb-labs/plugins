import path from 'node:path'
import { getOperationParameters, resolveOperationTypeNames } from '@internals/shared'
import { resolveZodSchemaNames } from '@internals/tanstack-query'
import { defineGenerator } from '@kubb/core'
import { Client, pluginClientName } from '@kubb/plugin-client'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRendererSync } from '@kubb/renderer-jsx'
import { difference } from 'remeda'
import { InfiniteQuery, InfiniteQueryOptions, QueryKey } from '../components'
import type { PluginReactQuery } from '../types'

/**
 * Built-in generator for `useInfiniteQuery` hooks. Enabled when
 * `pluginReactQuery({ infinite: { ... } })`. Emits one `useFooInfiniteQuery`
 * hook per query operation, wiring the configured `nextParam` /
 * `previousParam` paths into TanStack Query's cursor-based pagination.
 */
export const infiniteQueryGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-infinite-query',
  renderer: jsxRendererSync,
  operation(node, ctx) {
    const { config, driver, resolver, root } = ctx
    const { output, query, mutation, infinite, paramsCasing, paramsType, pathParamsType, parser, client: clientOptions, group, customOptions } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = driver.getResolver(pluginTsName)

    const isQuery = query === false || (!!query && query.methods.some((method) => node.method?.toLowerCase() === method.toLowerCase()))
    const isMutation =
      mutation !== false &&
      !isQuery &&
      difference(mutation ? mutation.methods : [], query ? query.methods : []).some((method) => node.method?.toLowerCase() === method.toLowerCase())
    const infiniteOptions = infinite && typeof infinite === 'object' ? infinite : null

    if (!isQuery || isMutation || !infiniteOptions) return null

    // Validate queryParam exists in operation's query parameters
    const normalizeKey = (key: string) => key.replace(/\?$/, '')
    const queryParamKeys = getOperationParameters(node).query.map((p) => p.name)
    const hasQueryParam = infiniteOptions.queryParam ? queryParamKeys.some((k) => normalizeKey(k) === infiniteOptions.queryParam) : false
    // cursorParam validation against response schema keys is skipped in v5 (complex schema inspection)
    const hasCursorParam = !infiniteOptions.cursorParam || true

    if (!hasQueryParam || !hasCursorParam) return null

    const importPath = query ? query.importPath : '@tanstack/react-query'

    const queryName = resolver.resolveInfiniteQueryName(node)
    const queryOptionsName = resolver.resolveInfiniteQueryOptionsName(node)
    const queryKeyName = resolver.resolveInfiniteQueryKeyName(node)
    const queryKeyTypeName = resolver.resolveInfiniteQueryKeyTypeName(node)
    const clientBaseName = resolver.resolveInfiniteClientName(node)

    const meta = {
      file: resolver.resolveFile(
        { name: queryName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: group ?? undefined },
      ),
      fileTs: tsResolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group ?? undefined },
      ),
    }

    const importedTypeNames = resolveOperationTypeNames(node, tsResolver, {
      paramsCasing,
      exclude: [queryKeyTypeName],
      order: 'body-response-first',
    })

    const pluginZod = parser === 'zod' ? driver.getPlugin(pluginZodName) : null
    const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : null
    const fileZod = zodResolver
      ? zodResolver.resolveFile(
          { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
          { root, output: pluginZod?.options?.output ?? output, group: pluginZod?.options?.group ?? undefined },
        )
      : null
    const zodSchemaNames = resolveZodSchemaNames(node, zodResolver)

    const clientPlugin = driver.getPlugin(pluginClientName)
    const hasClientPlugin = clientPlugin?.name === pluginClientName
    const shouldUseClientPlugin = hasClientPlugin && clientOptions.clientType !== 'class'
    const clientResolver = shouldUseClientPlugin ? driver.getResolver(pluginClientName) : null

    const clientFile = shouldUseClientPlugin
      ? clientResolver?.resolveFile(
          { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
          {
            root,
            output: clientPlugin?.options?.output ?? output,
            group: clientPlugin?.options?.group ?? undefined,
          },
        )
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
            {clientOptions.dataReturnType === 'full' && <File.Import name={['ResponseConfig']} path={clientOptions.importPath} isTypeOnly />}
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
            {clientOptions.dataReturnType === 'full' && (
              <File.Import name={['ResponseConfig']} root={meta.file.path} path={path.resolve(root, '.kubb/client.ts')} isTypeOnly />
            )}
          </>
        )}
        {shouldUseClientPlugin && clientFile && <File.Import name={[resolvedClientName]} root={meta.file.path} path={clientFile.path} />}
        {!shouldUseClientPlugin && <File.Import name={['buildFormData']} root={meta.file.path} path={path.resolve(root, '.kubb/config.ts')} />}
        {customOptions && <File.Import name={[customOptions.name]} path={customOptions.importPath} />}
        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <QueryKey
          name={queryKeyName}
          typeName={queryKeyTypeName}
          node={node}
          tsResolver={tsResolver}
          pathParamsType={pathParamsType}
          paramsCasing={paramsCasing}
          transformer={ctx.options.queryKey}
        />

        {!shouldUseClientPlugin && (
          <Client
            name={resolvedClientName}
            baseURL={clientOptions.baseURL}
            dataReturnType={clientOptions.dataReturnType || 'data'}
            paramsCasing={clientOptions.paramsCasing || paramsCasing}
            paramsType={paramsType}
            pathParamsType={pathParamsType}
            parser={parser}
            node={node}
            tsResolver={tsResolver}
            zodResolver={zodResolver}
          />
        )}

        <File.Import name={['InfiniteData']} isTypeOnly path={importPath} />
        <File.Import name={['infiniteQueryOptions']} path={importPath} />

        <InfiniteQueryOptions
          name={queryOptionsName}
          clientName={resolvedClientName}
          queryKeyName={queryKeyName}
          node={node}
          tsResolver={tsResolver}
          paramsCasing={paramsCasing}
          paramsType={paramsType}
          pathParamsType={pathParamsType}
          dataReturnType={clientOptions.dataReturnType || 'data'}
          cursorParam={infiniteOptions.cursorParam}
          nextParam={infiniteOptions.nextParam}
          previousParam={infiniteOptions.previousParam}
          initialPageParam={infiniteOptions.initialPageParam}
          queryParam={infiniteOptions.queryParam}
        />

        <File.Import name={['useInfiniteQuery']} path={importPath} />
        <File.Import name={['QueryKey', 'QueryClient', 'InfiniteQueryObserverOptions', 'UseInfiniteQueryResult']} path={importPath} isTypeOnly />

        <InfiniteQuery
          name={queryName}
          queryOptionsName={queryOptionsName}
          queryKeyName={queryKeyName}
          queryKeyTypeName={queryKeyTypeName}
          node={node}
          tsResolver={tsResolver}
          paramsCasing={paramsCasing}
          paramsType={paramsType}
          pathParamsType={pathParamsType}
          dataReturnType={clientOptions.dataReturnType || 'data'}
          initialPageParam={infiniteOptions.initialPageParam}
          queryParam={infiniteOptions.queryParam}
          customOptions={customOptions}
        />
      </File>
    )
  },
})
