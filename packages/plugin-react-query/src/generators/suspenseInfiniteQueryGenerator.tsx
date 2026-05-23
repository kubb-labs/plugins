import path from 'node:path'
import { getOperationParameters, groupOperationTypeImports, inlineOperationResolver, resolveOperationTypeImports } from '@internals/shared'
import { resolveZodSchemaNames } from '@internals/tanstack-query'
import { defineGenerator } from '@kubb/core'
import { Client, pluginClientName } from '@kubb/plugin-client'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRendererSync } from '@kubb/renderer-jsx'
import { difference } from 'remeda'
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
  renderer: jsxRendererSync,
  operation(node, ctx) {
    const { config, driver, resolver, root } = ctx
    const {
      output,
      query,
      mutation,
      infinite,
      suspense,
      paramsCasing,
      paramsType,
      pathParamsType,
      parser,
      client: clientOptions,
      group,
      customOptions,
    } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = inlineOperationResolver(driver.getResolver(pluginTsName), clientOptions.operationTypes)

    const isQuery = query === false || (!!query && query.methods.some((method) => node.method.toLowerCase() === method.toLowerCase()))
    const isMutation =
      mutation !== false &&
      !isQuery &&
      difference(mutation ? mutation.methods : [], query ? query.methods : []).some((method) => node.method.toLowerCase() === method.toLowerCase())
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
      file: resolver.resolveFile(
        { name: queryName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: group ?? undefined },
      ),
      fileTs: tsResolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group ?? undefined },
      ),
    }

    const resolveSchemaFilePath = (schemaName: string) =>
      tsResolver.resolveFile(
        { name: schemaName, extname: '.ts' },
        { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group ?? undefined },
      ).path
    const typeImports = resolveOperationTypeImports(node, tsResolver, {
      paramsCasing,
      order: 'body-response-first',
      operationTypes: clientOptions.operationTypes,
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
        banner={resolver.resolveBanner(ctx.meta, { output, config })}
        footer={resolver.resolveFooter(ctx.meta, { output, config })}
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
        {meta.fileTs &&
          groupOperationTypeImports(typeImports, meta.fileTs.path, resolveSchemaFilePath).map((typeImport) => (
            <File.Import key={typeImport.path} name={typeImport.names} root={meta.file.path} path={typeImport.path} isTypeOnly />
          ))}

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
            operationTypes={clientOptions.operationTypes ?? true}
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
          paramsCasing={paramsCasing}
          paramsType={paramsType}
          pathParamsType={pathParamsType}
          dataReturnType={clientOptions.dataReturnType || 'data'}
          operationTypes={clientOptions.operationTypes ?? true}
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
          paramsCasing={paramsCasing}
          paramsType={paramsType}
          pathParamsType={pathParamsType}
          dataReturnType={clientOptions.dataReturnType || 'data'}
          operationTypes={clientOptions.operationTypes ?? true}
          initialPageParam={infiniteOptions.initialPageParam}
          queryParam={infiniteOptions.queryParam}
          customOptions={customOptions}
        />
      </File>
    )
  },
})
