import path from 'node:path'
import { Operation } from '@internals/client'
import { operationFileEntry, resolveOperationTypeNames } from '@internals/shared'
import { resolveClientOperation } from '@internals/client'
import { resolveZodSchemaNames } from '@internals/tanstack-query'
import { ast, defineGenerator } from '@kubb/core'
import { isParserEnabled } from '@internals/client'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Query, QueryKey, QueryOptions } from '../components'
import type { PluginVueQuery } from '../types'

/**
 * Built-in generator for `useQuery` composables. Emits one `useFooQuery`
 * composable per GET operation (configurable via `query.methods`) plus the
 * matching `fooQueryKey` / `fooQueryOptions` helpers.
 */
export const queryGenerator = defineGenerator<PluginVueQuery>({
  name: 'vue-query',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, driver, resolver, root } = ctx
    const { output, query, mutation, parser, client, group } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = driver.getResolver(pluginTsName)

    const isQuery = query === false || (!!query && query.methods.some((method) => node.method.toLowerCase() === method.toLowerCase()))
    const queryMethods = new Set(query ? query.methods : [])
    const isMutation =
      mutation !== false &&
      !isQuery &&
      (mutation ? mutation.methods : []).some((method) => !queryMethods.has(method) && node.method.toLowerCase() === method.toLowerCase())

    if (!isQuery || isMutation) return null

    const importPath = query ? query.importPath : '@tanstack/vue-query'

    const queryName = resolver.resolveQueryName(node)
    const queryOptionsName = resolver.resolveQueryOptionsName(node)
    const queryKeyName = resolver.resolveQueryKeyName(node)
    const queryKeyTypeName = resolver.resolveQueryKeyTypeName(node)
    const clientName = resolver.resolveClientName(node)

    const meta = {
      file: resolver.resolveFile(operationFileEntry(node, queryName), { root, output, group: group ?? undefined }),
      fileTs: tsResolver.resolveFile(operationFileEntry(node, node.operationId), {
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
    }

    // The inline contract client references the plugin-ts `<Name>Responses` aggregate (the others do not).
    const importedTypeNames = [
      tsResolver.resolveRequestConfigName(node),
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

    // A registered contract client plugin owns the `<op>`; contract-inline renders its own client into this file.
    const contractOp =
      client.kind === 'contract' ? resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output }) : null
    const clientPath = path.resolve(root, '.kubb/client.ts')
    const calledClientName = contractOp ? contractOp.name : clientName

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

        <File.Import name={['toValue']} path="vue" />
        <File.Import name={['MaybeRefOrGetter']} path="vue" isTypeOnly />

        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <QueryKey name={queryKeyName} typeName={queryKeyTypeName} node={node} tsResolver={tsResolver} transformer={ctx.options.queryKey} />

        {client.kind === 'contract-inline' && <Operation name={clientName} node={node} tsResolver={tsResolver} zodResolver={zodResolver} parser={parser} />}

        <File.Import name={['queryOptions']} path={importPath} />

        <QueryOptions name={queryOptionsName} clientName={calledClientName} queryKeyName={queryKeyName} node={node} tsResolver={tsResolver} />

        {query && (
          <>
            <File.Import name={['useQuery']} path={importPath} />
            <File.Import name={['QueryKey', 'QueryClient', 'UseQueryOptions', 'UseQueryReturnType']} path={importPath} isTypeOnly />
            <Query
              name={queryName}
              queryOptionsName={queryOptionsName}
              queryKeyName={queryKeyName}
              queryKeyTypeName={queryKeyTypeName}
              node={node}
              tsResolver={tsResolver}
            />
          </>
        )}
      </File>
    )
  },
})
