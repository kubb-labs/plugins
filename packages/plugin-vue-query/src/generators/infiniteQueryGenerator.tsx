import { getOperationParameters, operationFileEntry, resolveOperationTypeNames } from '@internals/shared'
import { resolveClientOperation } from '@internals/client'
import { resolveZodSchemaNames } from '@internals/tanstack-query'
import { ast, defineGenerator } from '@kubb/core'
import { isValidatorEnabled } from '@internals/client'
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
    const { output, query, mutation, infinite, validator, client, group, hooks } = ctx.options

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

    // The registered contract client plugin owns the `<op>` the composable imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output })
    if (!contractOp) return null

    const queryName = resolver.resolveInfiniteQueryName(node)
    const queryOptionsName = resolver.resolveInfiniteQueryOptionsName(node)
    const queryKeyName = resolver.resolveInfiniteQueryKeyName(node)
    const queryKeyTypeName = resolver.resolveInfiniteQueryKeyTypeName(node)

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

    const importedTypeNames = [
      tsResolver.resolveRequestConfigName(node),
      queryParamsTypeName,
      ...resolveOperationTypeNames(node, tsResolver, {
        exclude: [queryKeyTypeName],
        order: 'body-response-first',
        includeParams: false,
      }),
    ].filter((name): name is string => Boolean(name))

    const pluginZod = isValidatorEnabled(validator) ? driver.getPlugin(pluginZodName) : null
    const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : null
    const fileZod = zodResolver
      ? zodResolver.resolveFile(operationFileEntry(node, node.operationId), {
          root,
          output: pluginZod?.options?.output ?? output,
          group: pluginZod?.options?.group ?? undefined,
        })
      : null
    const zodSchemaNames = resolveZodSchemaNames(node, zodResolver, validator)

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

        <File.Import name={['toValue']} path="vue" />
        <File.Import name={['MaybeRefOrGetter']} path="vue" isTypeOnly />

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

        {hooks && (
          <>
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
          </>
        )}
      </File>
    )
  },
})
