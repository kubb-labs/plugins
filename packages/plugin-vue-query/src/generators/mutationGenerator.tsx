import path from 'node:path'
import { Operation } from '@internals/client'
import { getRequestGroups, operationFileEntry, resolveOperationTypeNames } from '@internals/shared'
import { resolveClientOperation, resolveZodSchemaNames } from '@internals/tanstack-query'
import { ast, defineGenerator } from '@kubb/core'
import { isParserEnabled, LegacyClient } from '@kubb/plugin-client'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Mutation, MutationKey } from '../components'
import type { PluginVueQuery } from '../types'

/**
 * Built-in generator for `useMutation` composables. Emits one
 * `useFooMutation` composable per POST/PUT/DELETE operation (configurable
 * via `mutation.methods`) plus the matching `fooMutationKey` helper.
 */
export const mutationGenerator = defineGenerator<PluginVueQuery>({
  name: 'vue-query-mutation',
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

    if (!isMutation) return null

    const importPath = mutation ? mutation.importPath : '@tanstack/vue-query'

    const mutationHookName = resolver.resolveMutationName(node)
    const mutationTypeName = resolver.resolveMutationTypeName(node)
    const mutationKeyName = resolver.resolveMutationKeyName(node)
    const clientName = resolver.resolveClientName(node)

    const meta = {
      file: resolver.resolveFile(operationFileEntry(node, mutationHookName), { root, output, group: group ?? undefined }),
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
      ...resolveOperationTypeNames(node, tsResolver, { order: 'body-response-first', includeParams: false }),
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

    // The contract body unwraps each request group with `toValue()`, so it needs the runtime import.
    const groups = getRequestGroups(node)
    const hasRequestGroups = groups.path || groups.query || groups.body || groups.headers

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
            {node.requestBody?.content?.some((e) => e.contentType === 'multipart/form-data') && (
              <File.Import name={['buildFormData']} root={meta.file.path} path={path.resolve(root, '.kubb/config.ts')} />
            )}
            {parser === 'zod' && zodResolver && node.requestBody?.content?.[0]?.schema && <File.Import name={['z']} path="zod" isTypeOnly />}
          </>
        )}

        {contract && hasRequestGroups && <File.Import name={['toValue']} path="vue" />}
        <File.Import name={['MaybeRefOrGetter']} path="vue" isTypeOnly />

        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <MutationKey name={mutationKeyName} node={node} transformer={ctx.options.mutationKey} />

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

        {mutation && (
          <>
            <File.Import name={['useMutation']} path={importPath} />
            <File.Import name={['MutationObserverOptions', 'QueryClient']} path={importPath} isTypeOnly />
            <Mutation
              name={mutationHookName}
              clientName={calledClientName}
              typeName={mutationTypeName}
              node={node}
              tsResolver={tsResolver}
              dataReturnType={dataReturnType}
              mutationKeyName={mutationKeyName}
              slim={contract}
            />
          </>
        )}
      </File>
    )
  },
})
