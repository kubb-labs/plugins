import path from 'node:path'
import { Operation, resolveRequestParser, resolveResponseParser } from '@internals/client'
import { operationFileEntry } from '@internals/shared'
import { ast, defineGenerator } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Url } from '../components/Url.tsx'
import type { PluginClient } from '../types'
import { isParserEnabled } from '../utils.ts'

/**
 * Built-in operation generator for `@kubb/plugin-client` when `clientType: 'function'` (the
 * default). Emits one async function per OpenAPI operation using the shared `Operation` component,
 * so the output is the `RequestResult` contract identical to plugin-fetch: a grouped `options`
 * object and a `Promise<RequestResult<...>>` return. The optional `get<Operation>Url` helper is
 * still exported when `urlType: 'export'`, but the function body forwards a literal `url` and never
 * references it.
 */
export const clientGenerator = defineGenerator<PluginClient>({
  name: 'client',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, driver, resolver, root } = ctx
    const { output, urlType, parser, importPath, group } = ctx.options
    const baseURL = ctx.options.baseURL ?? ctx.meta.baseURL

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null

    const tsResolver = driver.getResolver(pluginTsName)

    const parserEnabled = isParserEnabled(parser)
    const pluginZod = parserEnabled ? driver.getPlugin(pluginZodName) : null
    const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : null

    const hasRequestBody = Boolean(node.requestBody?.content?.[0]?.schema)
    const importedTypeNames = [tsResolver.resolveRequestConfigName(node), tsResolver.resolveResponsesName(node)]

    const importedZodNames = zodResolver
      ? [
          resolveResponseParser(parser) === 'zod' ? zodResolver.resolveResponseName?.(node) : null,
          resolveRequestParser(parser) === 'zod' && hasRequestBody ? zodResolver.resolveDataName?.(node) : null,
        ].filter((name): name is string => Boolean(name))
      : []

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

    // Without `importPath` the contract runtime is bundled into `.kubb/client.ts`. Any `importPath`
    // opts out: the generated code imports `client`, `Options`, and `RequestResult` from there.
    const clientPath = importPath ?? path.resolve(root, '.kubb/client.ts')
    const clientImportProps = importPath ? { path: clientPath } : { root: meta.file.path, path: clientPath }

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name={['client']} {...clientImportProps} />
        <File.Import name={['Options', 'RequestResult']} {...clientImportProps} isTypeOnly />

        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        {meta.fileZod && importedZodNames.length > 0 && <File.Import name={importedZodNames} root={meta.file.path} path={meta.fileZod.path} />}

        {urlType === 'export' && (
          <Url
            name={meta.urlName}
            baseURL={baseURL}
            node={node}
            tsResolver={tsResolver}
            isIndexable={urlType === 'export'}
            isExportable={urlType === 'export'}
          />
        )}

        <Operation name={meta.name} node={node} tsResolver={tsResolver} zodResolver={zodResolver} parser={parser} />
      </File>
    )
  },
})
