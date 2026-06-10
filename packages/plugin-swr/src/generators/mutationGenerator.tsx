import path from 'node:path'
import { resolveOperationTypeNames } from '@internals/shared'
import { resolveZodSchemaNames } from '@internals/tanstack-query'
import { ast, defineGenerator } from '@kubb/core'
import { Client, isParserEnabled, pluginClientName } from '@kubb/plugin-client'
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
    const { output, query, mutation, paramsCasing, paramsType, pathParamsType, parser, client: clientOptions, group } = ctx.options

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

    const importedTypeNames = resolveOperationTypeNames(node, tsResolver, { paramsCasing, order: 'body-response-first' })

    const pluginZod = isParserEnabled(parser) ? driver.getPlugin(pluginZodName) : undefined
    const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : undefined
    const fileZod = zodResolver
      ? zodResolver.resolveFile(
          { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
          { root, output: pluginZod?.options?.output ?? output, group: pluginZod?.options?.group },
        )
      : undefined
    const zodSchemaNames = resolveZodSchemaNames(node, zodResolver, parser)

    const clientPlugin = driver.getPlugin(pluginClientName)
    const hasClientPlugin = clientPlugin?.name === pluginClientName
    const shouldUseClientPlugin = hasClientPlugin && clientOptions.clientType !== 'class'
    const clientResolver = shouldUseClientPlugin ? driver.getResolver(pluginClientName) : undefined

    const clientFile = shouldUseClientPlugin
      ? clientResolver?.resolveFile(
          { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
          {
            root,
            output: clientPlugin?.options?.output ?? output,
            group: clientPlugin?.options?.group,
          },
        )
      : undefined

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
          </>
        )}
        {shouldUseClientPlugin && clientFile && <File.Import name={[resolvedClientName]} root={meta.file.path} path={clientFile.path} />}
        {!shouldUseClientPlugin && node.requestBody?.content?.some((e) => e.contentType === 'multipart/form-data') && (
          <File.Import name={['buildFormData']} root={meta.file.path} path={path.resolve(root, '.kubb/config.ts')} />
        )}
        {!shouldUseClientPlugin && parser === 'zod' && zodResolver && node.requestBody?.content?.[0]?.schema && (
          <File.Import name={['z']} path="zod" isTypeOnly />
        )}
        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <MutationKey
          name={mutationKeyName}
          typeName={mutationKeyTypeName}
          node={node}
          pathParamsType={pathParamsType}
          paramsCasing={paramsCasing}
          transformer={ctx.options.mutationKey}
        />

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

        {mutation && (
          <>
            <File.Import name={'useSWRMutation'} path={importPath} />
            <File.Import name={['SWRMutationConfiguration']} path={importPath} isTypeOnly />
            <Mutation
              name={mutationHookName}
              clientName={resolvedClientName}
              mutationKeyName={mutationKeyName}
              mutationKeyTypeName={mutationKeyTypeName}
              mutationArgTypeName={mutationArgTypeName}
              node={node}
              tsResolver={tsResolver}
              dataReturnType={clientOptions.dataReturnType || 'data'}
              paramsCasing={paramsCasing}
              paramsType={paramsType}
              pathParamsType={pathParamsType}
            />
          </>
        )}
      </File>
    )
  },
})
