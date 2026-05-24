import path from 'node:path'
import { groupOperationTypeImports, resolveOperationTypeImports } from '@internals/shared'
import { defineGenerator } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRendererSync } from '@kubb/renderer-jsx'
import { Client } from '../components/Client'
import { Url } from '../components/Url.tsx'
import type { PluginClient } from '../types'

/**
 * Built-in operation generator for `@kubb/plugin-client`. Emits one async
 * function per OpenAPI operation, plus the matching URL helper. Used when
 * `clientType: 'function'` (the default).
 */
export const clientGenerator = defineGenerator<PluginClient>({
  name: 'client',
  renderer: jsxRendererSync,
  operation(node, ctx) {
    const { config, driver, resolver, root } = ctx
    const { output, urlType, dataReturnType, paramsCasing, paramsType, pathParamsType, parser, importPath, group } = ctx.options
    const baseURL = ctx.options.baseURL ?? ctx.meta.baseURL

    const pluginTs = driver.getPlugin(pluginTsName)

    if (!pluginTs) {
      return null
    }

    const tsResolver = driver.getResolver(pluginTsName)

    const pluginZod = parser === 'zod' ? driver.getPlugin(pluginZodName) : null
    const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : null

    const typeImports = resolveOperationTypeImports(node, tsResolver, { paramsCasing, operationTypes: pluginTs.options?.operationTypes })

    const importedZodNames =
      zodResolver && parser === 'zod'
        ? [zodResolver.resolveResponseName?.(node), node.requestBody?.content?.[0]?.schema ? zodResolver.resolveDataName?.(node) : null].filter(
            (name): name is string => Boolean(name),
          )
        : []

    const meta = {
      name: resolver.resolveName(node.operationId),
      urlName: resolver.resolveUrlName(node),
      file: resolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output, group: group ?? undefined },
      ),
      fileTs: tsResolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        {
          root,
          output: pluginTs.options?.output ?? output,
          group: pluginTs.options?.group ?? undefined,
        },
      ),
      fileZod:
        zodResolver && pluginZod?.options
          ? zodResolver.resolveFile(
              { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
              {
                root,
                output: pluginZod.options.output ?? output,
                group: pluginZod.options?.group ?? undefined,
              },
            )
          : null,
    } as const

    const hasFormData = node.requestBody?.content?.some((e) => e.contentType === 'multipart/form-data') ?? false

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config })}
        footer={resolver.resolveFooter(ctx.meta, { output, config })}
      >
        {importPath ? (
          <>
            <File.Import name={'client'} path={importPath} />
            <File.Import name={['Client', 'RequestConfig', 'ResponseErrorConfig']} path={importPath} isTypeOnly />
          </>
        ) : (
          <>
            <File.Import name={['client']} root={meta.file.path} path={path.resolve(root, '.kubb/client.ts')} />
            <File.Import
              name={['Client', 'RequestConfig', 'ResponseErrorConfig']}
              root={meta.file.path}
              path={path.resolve(root, '.kubb/client.ts')}
              isTypeOnly
            />
          </>
        )}

        {hasFormData && <File.Import name={['buildFormData']} root={meta.file.path} path={path.resolve(root, '.kubb/config.ts')} />}

        {meta.fileZod && importedZodNames.length > 0 && <File.Import name={importedZodNames as Array<string>} root={meta.file.path} path={meta.fileZod.path} />}

        {meta.fileTs &&
          groupOperationTypeImports(
            typeImports,
            meta.fileTs.path,
            (schemaName) =>
              tsResolver.resolveFile(
                { name: schemaName, extname: '.ts' },
                { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group ?? undefined },
              ).path,
          ).map((typeImport) => <File.Import key={typeImport.path} name={typeImport.names} root={meta.file.path} path={typeImport.path} isTypeOnly />)}

        <Url
          name={meta.urlName}
          baseURL={baseURL}
          pathParamsType={pathParamsType}
          paramsCasing={paramsCasing}
          paramsType={paramsType}
          node={node}
          tsResolver={tsResolver}
          isIndexable={urlType === 'export'}
          isExportable={urlType === 'export'}
        />

        <Client
          name={meta.name}
          urlName={meta.urlName}
          baseURL={baseURL}
          dataReturnType={dataReturnType}
          pathParamsType={pathParamsType}
          paramsCasing={paramsCasing}
          paramsType={paramsType}
          node={node}
          tsResolver={tsResolver}
          zodResolver={zodResolver}
          parser={parser}
        />
      </File>
    )
  },
})
