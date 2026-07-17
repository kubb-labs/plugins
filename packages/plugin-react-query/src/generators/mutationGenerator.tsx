import { operationFileEntry, resolveOperationTypeImports } from '@internals/shared'
import { resolveClientOperation } from '@internals/client'
import { ast, defineGenerator } from 'kubb/kit'
import { defaultOperationTypes, pluginTsName } from '@kubb/plugin-ts'
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
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, driver, resolver, root } = ctx
    const { output, query, mutation, client, group, customOptions, hooks } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = driver.getResolver(pluginTsName)

    const { isMutation } = classifyOperation(node, { query, mutation })

    if (!isMutation) return null

    const importPath = mutation ? mutation.importPath : '@tanstack/react-query'

    // The registered contract client plugin owns the `<op>` the hook imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output })
    if (!contractOp) return null

    const mutationHookName = resolver.mutation.name(node)
    const mutationTypeName = resolver.mutation.typeName(node)
    const mutationOptionsName = resolver.mutation.optionsName(node)
    const mutationKeyName = resolver.mutation.keyName(node)

    const tsOutput = pluginTs.options?.output ?? output
    const tsGroup = pluginTs.options?.group ?? undefined

    const meta = {
      file: resolver.file({ ...operationFileEntry(node, mutationHookName), root, output, group: group ?? undefined }),
      fileTs: tsResolver.file({ ...operationFileEntry(node, node.operationId), root, output: tsOutput, group: tsGroup }),
    }

    const typeImportGroups = meta.fileTs
      ? resolveOperationTypeImports(node, tsResolver, {
          order: 'body-response-first',
          includeParams: false,
          operationTypes: pluginTs.options?.operationTypes ?? defaultOperationTypes,
          operationFilePath: meta.fileTs.path,
          root,
          output: tsOutput,
          group: tsGroup,
          extraNames: [tsResolver.response.options(node)],
        })
      : []

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
        {typeImportGroups.map((typeImport) => (
          <File.Import key={typeImport.path} name={typeImport.names} root={meta.file.path} path={typeImport.path} isTypeOnly />
        ))}

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
