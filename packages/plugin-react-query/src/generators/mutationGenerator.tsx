import { operationFileEntry, resolveDependencyOperationFile, resolveOperationTypeNames } from '@internals/shared'
import { resolveClientOperation } from '@internals/client'
import { ast, defineGenerator } from 'kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
import { Mutation, MutationKey, MutationOptions } from '../components'
import { classifyOperation } from '../utils.ts'
import type { PluginReactQuery } from '../types'

/**
 * Built-in generator for `useMutation` hooks. Emits one `useFooMutation` hook
 * per POST/PUT/DELETE operation (configurable via `mutation.methods`) plus
 * the matching `fooMutationKey` / `fooMutationOptions` helpers.
 */
export const mutationGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-query-mutation',
  renderer: jsxRenderer,
  match(node, ctx) {
    const operationNode = node as ast.OperationNode
    if (!ast.isHttpOperationNode(operationNode)) return false
    const { query, mutation } = ctx.options
    return classifyOperation(operationNode, { query, mutation }).isMutation
  },
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, driver, resolver, root } = ctx
    const { output, mutation, client, group, customOptions, hooks } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = driver.getResolver(pluginTsName)

    const importPath = mutation ? mutation.importPath : '@tanstack/react-query'

    // The registered contract client plugin owns the `<op>` the hook imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output, cache: ctx.cache })
    if (!contractOp) return null

    const mutationHookName = resolver.mutation.name(node)
    const mutationTypeName = resolver.mutation.typeName(node)
    const mutationOptionsName = resolver.mutation.optionsName(node)
    const mutationKeyName = resolver.mutation.keyName(node)

    const meta = {
      file: resolver.file({ ...operationFileEntry(node, mutationHookName), root, output, group: group ?? undefined }),
      fileTs: resolveDependencyOperationFile({
        cache: ctx.cache,
        node,
        resolver: tsResolver,
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group,
      }),
    }

    const importedTypeNames = [
      tsResolver.response.options(node),
      ...resolveOperationTypeNames(node, tsResolver, { order: 'body-response-first', includeParams: false }),
    ].filter((name): name is string => Boolean(name))

    const calledClientName = contractOp.name

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

        {customOptions && <File.Import name={[customOptions.name]} path={customOptions.importPath} />}
        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <MutationKey name={mutationKeyName} node={node} transformer={ctx.options.mutationKey} />

        <File.Import name={['mutationOptions']} path={importPath} />

        <MutationOptions name={mutationOptionsName} clientName={calledClientName} mutationKeyName={mutationKeyName} node={node} tsResolver={tsResolver} />

        {mutation && hooks && (
          <>
            <File.Import name={['useMutation']} path={importPath} />
            <File.Import name={['UseMutationOptions', 'UseMutationResult', 'QueryClient']} path={importPath} isTypeOnly />
            <Mutation
              name={mutationHookName}
              typeName={mutationTypeName}
              mutationOptionsName={mutationOptionsName}
              mutationKeyName={mutationKeyName}
              node={node}
              tsResolver={tsResolver}
              customOptions={customOptions}
            />
          </>
        )}
      </File>
    )
  },
})
