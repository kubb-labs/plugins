import path from 'node:path'
import { resolveOperationTypeNames } from '@internals/shared'
import { resolveZodSchemaNames } from '@internals/tanstack-query'
import { defineGenerator } from '@kubb/core'
import { Client, pluginClientName } from '@kubb/plugin-client'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRendererSync } from '@kubb/renderer-jsx'
import { difference } from 'remeda'
import { Mutation, MutationKey, MutationOptions } from '../components'
import type { PluginReactQuery } from '../types'

/**
 * Built-in generator for `useMutation` hooks. Emits one `useFooMutation` hook
 * per POST/PUT/DELETE operation (configurable via `mutation.methods`) plus
 * the matching `fooMutationKey` / `fooMutationOptions` helpers.
 */
export const mutationGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-query-mutation',
  renderer: jsxRendererSync,
  operation(node, ctx) {
    const { config, driver, resolver, root } = ctx
    const { output, query, mutation, paramsCasing, paramsType, pathParamsType, parser, client: clientOptions, group, customOptions } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = driver.getResolver(pluginTsName)

    const isQuery = query === false || (!!query && query.methods.some((method) => node.method?.toLowerCase() === method.toLowerCase()))
    const isMutation =
      mutation !== false &&
      !isQuery &&
      difference(mutation ? mutation.methods : [], query ? query.methods : []).some((method) => node.method?.toLowerCase() === method.toLowerCase())

    if (!isMutation) return null

    const importPath = mutation ? mutation.importPath : '@tanstack/react-query'

    const mutationHookName = resolver.resolveMutationName(node)
    const mutationTypeName = resolver.resolveMutationTypeName(node)
    const mutationOptionsName = resolver.resolveMutationOptionsName(node)
    const mutationKeyName = resolver.resolveMutationKeyName(node)
    const clientName = resolver.resolveClientName(node)

    const meta = {
      file: resolver.resolveFile(
        { name: mutationHookName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: group ?? undefined },
      ),
      fileTs: tsResolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group ?? undefined },
      ),
    }

    const importedTypeNames = resolveOperationTypeNames(node, tsResolver, { paramsCasing, order: 'body-response-first' })

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

    const resolvedClientName = shouldUseClientPlugin ? (clientResolver?.resolveName(node.operationId) ?? clientName) : clientName

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
        {!shouldUseClientPlugin && node.requestBody?.content?.some((e) => e.contentType === 'multipart/form-data') && (
          <File.Import name={['buildFormData']} root={meta.file.path} path={path.resolve(root, '.kubb/config.ts')} />
        )}
        {customOptions && <File.Import name={[customOptions.name]} path={customOptions.importPath} />}
        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <MutationKey name={mutationKeyName} node={node} pathParamsType={pathParamsType} paramsCasing={paramsCasing} transformer={ctx.options.mutationKey} />

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

        <File.Import name={['mutationOptions']} path={importPath} />

        <MutationOptions
          name={mutationOptionsName}
          clientName={resolvedClientName}
          mutationKeyName={mutationKeyName}
          node={node}
          tsResolver={tsResolver}
          paramsCasing={paramsCasing}
          paramsType={paramsType}
          pathParamsType={pathParamsType}
          dataReturnType={clientOptions.dataReturnType || 'data'}
        />

        {mutation && (
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
              dataReturnType={clientOptions.dataReturnType || 'data'}
              paramsCasing={paramsCasing}
              pathParamsType={pathParamsType}
              customOptions={customOptions}
            />
          </>
        )}
      </File>
    )
  },
})
