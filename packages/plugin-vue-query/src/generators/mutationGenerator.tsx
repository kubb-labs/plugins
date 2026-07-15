import { getRequestGroups, operationFileEntry, resolveOperationTypeNames } from '@internals/shared'
import { resolveClientOperation } from '@internals/client'
import { classifyOperation } from '@internals/tanstack-query'
import { ast, defineGenerator } from 'kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
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
    const { output, query, mutation, client, group, hooks } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = driver.getResolver(pluginTsName)

    const { isMutation } = classifyOperation(node, { query, mutation })

    if (!isMutation) return null

    const importPath = mutation ? mutation.importPath : '@tanstack/vue-query'

    // The registered contract client plugin owns the `<op>` the composable imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output })
    if (!contractOp) return null

    const mutationHookName = resolver.mutation.name(node)
    const mutationTypeName = resolver.mutation.typeName(node)
    const mutationKeyName = resolver.mutation.keyName(node)

    const meta = {
      file: resolver.file({ ...operationFileEntry(node, mutationHookName), root, output, group: group ?? undefined }),
      fileTs: tsResolver.file({
        ...operationFileEntry(node, node.operationId),
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
    }

    const importedTypeNames = [
      tsResolver.response.options(node),
      ...resolveOperationTypeNames(node, tsResolver, { order: 'body-response-first', includeParams: false }),
    ].filter((name): name is string => Boolean(name))

    const calledClientName = contractOp.name

    // The contract body unwraps each request group with `toValue()`, so it needs the runtime import.
    const groups = getRequestGroups(node)
    const hasRequestGroups = groups.path || groups.query || groups.body || groups.headers

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

        {hasRequestGroups && <File.Import name={['toValue']} path="vue" />}
        <File.Import name={['MaybeRefOrGetter']} path="vue" isTypeOnly />

        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <MutationKey name={mutationKeyName} node={node} transformer={ctx.options.mutationKey} />

        {mutation && hooks && (
          <>
            <File.Import name={['useMutation']} path={importPath} />
            <File.Import name={['MutationObserverOptions', 'QueryClient']} path={importPath} isTypeOnly />
            <Mutation
              name={mutationHookName}
              clientName={calledClientName}
              typeName={mutationTypeName}
              node={node}
              tsResolver={tsResolver}
              mutationKeyName={mutationKeyName}
            />
          </>
        )}
      </File>
    )
  },
})
