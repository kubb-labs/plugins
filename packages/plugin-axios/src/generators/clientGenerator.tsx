import path from 'node:path'
import {
  buildParserHooks,
  buildZodErrorParse,
  getOperationSecurity,
  Operation,
  resolveRequestParser,
  resolveResponseParser,
  type SecurityDocument,
} from '@internals/client'
import { operationFileEntry } from '@internals/shared'
import { ast, defineGenerator } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import type { PluginAxios } from '../types.ts'

/**
 * Built-in operation generator for `@kubb/plugin-axios`. Emits one async function per OpenAPI
 * operation using the shared `Operation` component: a grouped `<Name>Request` type and a function that
 * forwards a single `options` object to the bundled `client` and returns the `RequestResult`.
 */
export const clientGenerator = defineGenerator<PluginAxios>({
  name: 'axios',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null

    const { config, driver, resolver, root } = ctx
    const { output, parser, group } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null

    const tsResolver = driver.getResolver(pluginTsName)

    const parserEnabled = resolveResponseParser(parser) === 'zod' || resolveRequestParser(parser) === 'zod'
    const pluginZod = parserEnabled ? driver.getPlugin(pluginZodName) : null
    const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : null

    const hasRequestBody = Boolean(node.requestBody?.content?.[0]?.schema)
    const importedTypeNames = [tsResolver.resolveRequestConfigName(node), tsResolver.resolveResponsesName(node)]

    const importedZodNames = zodResolver
      ? [
          resolveResponseParser(parser) === 'zod' ? zodResolver.resolveResponseName?.(node) : null,
          resolveResponseParser(parser) === 'zod' ? (buildZodErrorParse(node, zodResolver)?.expression ?? null) : null,
          resolveRequestParser(parser) === 'zod' && hasRequestBody ? zodResolver.resolveDataName?.(node) : null,
        ].filter((name): name is string => Boolean(name))
      : []

    const meta = {
      name: resolver.resolveName(node.operationId),
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

    const security = getOperationSecurity({
      document: ctx.adapter.document as SecurityDocument | null | undefined,
      method: node.method,
      path: node.path,
    })

    const clientPath = path.resolve(root, '.kubb/client.ts')
    const standardSchemaPath = path.resolve(root, '.kubb/standard-schema.ts')

    const parserHooks = buildParserHooks({ node, parser, zodResolver })

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name={['client']} root={meta.file.path} path={clientPath} />
        <File.Import name={['Options', 'RequestResult']} root={meta.file.path} path={clientPath} isTypeOnly />

        {parserHooks.needsValidateHelper && <File.Import name={['validateStandardSchema']} root={meta.file.path} path={standardSchemaPath} />}

        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        {meta.fileZod && importedZodNames.length > 0 && <File.Import name={importedZodNames} root={meta.file.path} path={meta.fileZod.path} />}

        <Operation name={meta.name} node={node} tsResolver={tsResolver} zodResolver={zodResolver} parser={parser} security={security} />
      </File>
    )
  },
})
