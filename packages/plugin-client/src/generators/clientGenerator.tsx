import path from 'node:path'
import { getOperationParameters, operationFileEntry, resolveOperationTypeNames } from '@internals/shared'
import { ast, defineGenerator } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Client } from '../components/Client'
import { Url } from '../components/Url.tsx'
import type { PluginClient } from '../types'
import { isParserEnabled, resolveQueryParamsParser, resolveRequestParser, resolveResponseParser } from '../utils.ts'

/**
 * Built-in operation generator for `@kubb/plugin-client`. Emits one async
 * function per OpenAPI operation, plus the matching URL helper. Used when
 * `clientType: 'function'` (the default).
 */
export const clientGenerator = defineGenerator<PluginClient>({
  name: 'client',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, driver, resolver, root } = ctx
    const { output, urlType, dataReturnType, parser, importPath, group } = ctx.options
    const baseURL = ctx.options.baseURL ?? ctx.meta.baseURL

    const pluginTs = driver.getPlugin(pluginTsName)

    if (!pluginTs) {
      return null
    }

    const tsResolver = driver.getResolver(pluginTsName)

    const pluginZod = isParserEnabled(parser) ? driver.getPlugin(pluginZodName) : null
    const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : null

    const { query: queryParams } = getOperationParameters(node)

    const importedTypeNames = [tsResolver.resolveRequestConfigName(node), ...resolveOperationTypeNames(node, tsResolver, { includeParams: false })]

    const importedZodNames = zodResolver
      ? [
          resolveResponseParser(parser) === 'zod' ? zodResolver.resolveResponseName?.(node) : null,
          resolveRequestParser(parser) === 'zod' && node.requestBody?.content?.[0]?.schema ? zodResolver.resolveDataName?.(node) : null,
          resolveQueryParamsParser(parser) === 'zod' && queryParams.length > 0 ? zodResolver.resolveQueryParamsName?.(node, queryParams[0]!) : null,
        ].filter((name): name is string => Boolean(name))
      : []

    const zodRequestName = zodResolver && parser === 'zod' && node.requestBody?.content?.[0]?.schema ? (zodResolver.resolveDataName?.(node) ?? null) : null

    const meta = {
      name: resolver.resolveName(node.operationId),
      urlName: resolver.resolveUrlName(node),
      file: resolver.resolveFile(operationFileEntry(node, node.operationId), { root, output, group: group ?? undefined }),
      fileTs: tsResolver.resolveFile(operationFileEntry(node, node.operationId), {
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
      fileZod:
        zodResolver && pluginZod?.options
          ? zodResolver.resolveFile(operationFileEntry(node, node.operationId), {
              root,
              output: pluginZod.options.output ?? output,
              group: pluginZod.options?.group ?? undefined,
            })
          : null,
    } as const

    const hasFormData = node.requestBody?.content?.some((e) => e.contentType === 'multipart/form-data') ?? false

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
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

        {zodRequestName && <File.Import name={['z']} path="zod" isTypeOnly />}

        {meta.fileZod && importedZodNames.length > 0 && <File.Import name={importedZodNames as Array<string>} root={meta.file.path} path={meta.fileZod.path} />}

        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <Url name={meta.urlName} baseURL={baseURL} node={node} tsResolver={tsResolver} isIndexable={urlType === 'export'} isExportable={urlType === 'export'} />

        <Client
          name={meta.name}
          urlName={meta.urlName}
          baseURL={baseURL}
          dataReturnType={dataReturnType}
          node={node}
          tsResolver={tsResolver}
          zodResolver={zodResolver}
          parser={parser}
        />
      </File>
    )
  },
})
