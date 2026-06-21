import path from 'node:path'
import { Operation } from '@internals/client'
import { getOperationParameters, operationFileEntry, resolveOperationTypeNames } from '@internals/shared'
import { resolveClientOperation, resolveZodSchemaNames } from '@internals/tanstack-query'
import { ast, defineGenerator } from '@kubb/core'
import { isParserEnabled, LegacyClient } from '@kubb/plugin-client'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { InfiniteQuery, InfiniteQueryOptions, QueryKey } from '../components'
import type { PluginVueQuery } from '../types'

/**
 * Built-in generator for `useInfiniteQuery` composables. Enabled when
 * `pluginVueQuery({ infinite: { ... } })`. Emits one `useFooInfiniteQuery`
 * composable per query operation, wiring the configured cursor path into
 * TanStack Query's cursor-based pagination.
 */
export const infiniteQueryGenerator = defineGenerator<PluginVueQuery>({
  name: 'vue-query-infinite',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, driver, resolver, root } = ctx
    const { output, query, mutation, infinite, parser, client, group } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = driver.getResolver(pluginTsName)

    const isQuery = query === false || (!!query && query.methods.some((method) => node.method.toLowerCase() === method.toLowerCase()))
    const queryMethods = new Set(query ? query.methods : [])
    const isMutation =
      mutation !== false &&
      !isQuery &&
      (mutation ? mutation.methods : []).some((method) => !queryMethods.has(method) && node.method.toLowerCase() === method.toLowerCase())
    const infiniteOptions = infinite && typeof infinite === 'object' ? infinite : null

    if (!isQuery || isMutation || !infiniteOptions) return null

    // Validate queryParam exists in operation's query parameters
    const normalizeKey = (key: string) => key.replace(/\?$/, '')
    const queryParamKeys = getOperationParameters(node, { paramsCasing: 'original' }).query.map((p) => p.name)
    const hasQueryParam = infiniteOptions.queryParam ? queryParamKeys.some((k) => normalizeKey(k) === infiniteOptions.queryParam) : false
    // cursorParam validation against response schema keys is skipped in v5 (complex schema inspection)
    const hasCursorParam = !infiniteOptions.cursorParam || true

    if (!hasQueryParam || !hasCursorParam) return null

    const importPath = query ? query.importPath : '@tanstack/vue-query'

    const queryName = resolver.resolveInfiniteQueryName(node)
    const queryOptionsName = resolver.resolveInfiniteQueryOptionsName(node)
    const queryKeyName = resolver.resolveInfiniteQueryKeyName(node)
    const queryKeyTypeName = resolver.resolveInfiniteQueryKeyTypeName(node)
    const clientName = resolver.resolveInfiniteClientName(node)

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

    // The inline contract client references the plugin-ts `<Name>Responses` aggregate (the others do not).
    const importedTypeNames = [
      tsResolver.resolveRequestConfigName(node),
      queryParamsTypeName,
      client.kind === 'contract-inline' ? tsResolver.resolveResponsesName(node) : null,
      ...resolveOperationTypeNames(node, tsResolver, {
        exclude: [queryKeyTypeName],
        order: 'body-response-first',
        includeParams: false,
      }),
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

    const contractOp =
      client.kind === 'contract' ? resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output }) : null
    const contract = client.kind === 'contract' || client.kind === 'contract-inline'
    const clientPath = path.resolve(root, '.kubb/client.ts')
    const calledClientName = contractOp ? contractOp.name : clientName
    const dataReturnType = client.kind === 'legacy' ? client.dataReturnType : 'data'

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        {fileZod && zodSchemaNames.length > 0 && <File.Import name={zodSchemaNames} root={meta.file.path} path={fileZod.path} />}

        {contractOp && (
          <>
            <File.Import name={[contractOp.name]} root={meta.file.path} path={contractOp.path} />
            <File.Import name={['RequestConfig', 'ResponseErrorConfig']} root={meta.file.path} path={contractOp.clientPath} isTypeOnly />
          </>
        )}

        {client.kind === 'contract-inline' && (
          <>
            <File.Import name={['client']} root={meta.file.path} path={clientPath} />
            <File.Import name={['Options', 'RequestResult']} root={meta.file.path} path={clientPath} isTypeOnly />
            <File.Import name={['RequestConfig', 'ResponseErrorConfig']} root={meta.file.path} path={clientPath} isTypeOnly />
          </>
        )}

        {client.kind === 'legacy' && (
          <>
            <File.Import name={['client']} root={meta.file.path} path={clientPath} />
            <File.Import name={['Client', 'RequestConfig', 'ResponseErrorConfig']} root={meta.file.path} path={clientPath} isTypeOnly />
            <File.Import name={['buildFormData']} root={meta.file.path} path={path.resolve(root, '.kubb/config.ts')} />
          </>
        )}

        <File.Import name={['toValue']} path="vue" />
        <File.Import name={['MaybeRefOrGetter']} path="vue" isTypeOnly />

        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <QueryKey name={queryKeyName} typeName={queryKeyTypeName} node={node} tsResolver={tsResolver} transformer={ctx.options.queryKey} />

        {client.kind === 'contract-inline' && <Operation name={clientName} node={node} tsResolver={tsResolver} zodResolver={zodResolver} parser={parser} />}

        {client.kind === 'legacy' && (
          <LegacyClient
            name={clientName}
            baseURL={client.baseURL}
            dataReturnType={dataReturnType}
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
          clientName={calledClientName}
          queryKeyName={queryKeyName}
          node={node}
          tsResolver={tsResolver}
          dataReturnType={dataReturnType}
          cursorParam={infiniteOptions.cursorParam}
          nextParam={infiniteOptions.nextParam}
          previousParam={infiniteOptions.previousParam}
          initialPageParam={infiniteOptions.initialPageParam}
          queryParam={infiniteOptions.queryParam}
          slim={contract}
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
          dataReturnType={dataReturnType}
          initialPageParam={infiniteOptions.initialPageParam}
          queryParam={infiniteOptions.queryParam}
          slim={contract}
        />
      </File>
    )
  },
})
