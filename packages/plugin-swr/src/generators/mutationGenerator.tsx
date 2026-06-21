import path from 'node:path'
import { Operation } from '@internals/client'
import { resolveOperationTypeNames } from '@internals/shared'
import { resolveClientOperation, resolveZodSchemaNames } from '@internals/tanstack-query'
import { ast, defineGenerator } from '@kubb/core'
import { isParserEnabled } from '@internals/client'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Mutation, MutationKey } from '../components'
import type { PluginSwr } from '../types'

/**
 * Built-in generator for `useSWRMutation` hooks. Emits one `useFooMutation` hook
 * per POST/PUT/DELETE operation (configurable via `mutation.methods`) plus
 * the matching `fooMutationKey` helper.
 */
export const mutationGenerator = defineGenerator<PluginSwr>({
  name: 'swr-mutation',
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

    const importPath = mutation ? mutation.importPath : 'swr/mutation'

    const mutationHookName = resolver.resolveMutationName(node)
    const mutationKeyName = resolver.resolveMutationKeyName(node)
    const mutationKeyTypeName = resolver.resolveMutationKeyTypeName(node)
    const mutationArgTypeName = resolver.resolveMutationArgTypeName(node)
    const clientName = resolver.resolveClientName(node)

    const meta = {
      file: resolver.resolveFile({ name: mutationHookName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
      fileTs: tsResolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group },
      ),
    }

    // The inline contract client references the plugin-ts `<Name>Responses` aggregate (the others do not).
    const importedTypeNames = [
      tsResolver.resolveRequestConfigName(node),
      client.kind === 'contract-inline' ? tsResolver.resolveResponsesName(node) : null,
      ...resolveOperationTypeNames(node, tsResolver, { order: 'body-response-first', includeParams: false }),
    ].filter((name): name is string => Boolean(name))

    const pluginZod = isParserEnabled(parser) ? driver.getPlugin(pluginZodName) : undefined
    const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : undefined
    const fileZod = zodResolver
      ? zodResolver.resolveFile(
          { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
          { root, output: pluginZod?.options?.output ?? output, group: pluginZod?.options?.group },
        )
      : undefined
    const zodSchemaNames = resolveZodSchemaNames(node, zodResolver, parser)

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

        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <MutationKey name={mutationKeyName} typeName={mutationKeyTypeName} node={node} transformer={ctx.options.mutationKey} />

        {client.kind === 'contract-inline' && <Operation name={clientName} node={node} tsResolver={tsResolver} zodResolver={zodResolver} parser={parser} />}

        {mutation && (
          <>
            <File.Import name={'useSWRMutation'} path={importPath} />
            <File.Import name={['SWRMutationConfiguration']} path={importPath} isTypeOnly />
            <Mutation
              name={mutationHookName}
              clientName={calledClientName}
              mutationKeyName={mutationKeyName}
              mutationKeyTypeName={mutationKeyTypeName}
              mutationArgTypeName={mutationArgTypeName}
              node={node}
              tsResolver={tsResolver}
            />
          </>
        )}
      </File>
    )
  },
})
