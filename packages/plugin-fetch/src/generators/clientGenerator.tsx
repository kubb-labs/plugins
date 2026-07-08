import path from 'node:path'
import {
  buildZodErrorParse,
  getOperationSecurity,
  Operation,
  resolveRequestValidator,
  resolveResponseValidator,
  type SecurityDocument,
} from '@internals/client'
import { isEventStream, operationFileEntry } from '@internals/shared'
import { ast, defineGenerator } from 'kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from 'kubb/jsx'
import type { PluginFetch } from '../types.ts'

/**
 * Built-in operation generator for `@kubb/plugin-fetch`. Emits one async function per OpenAPI
 * operation using the shared `Operation` component: a grouped `<Name>Request` type and a function that
 * forwards a single `options` object to the bundled `client` and returns the `RequestResult`.
 */
export const clientGenerator = defineGenerator<PluginFetch>({
  name: 'fetch',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null

    const { config, driver, resolver, root } = ctx
    const { output, validator, group } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null

    const tsResolver = driver.getResolver(pluginTsName)

    const validatorEnabled = resolveResponseValidator(validator) === 'zod' || resolveRequestValidator(validator) === 'zod'
    const pluginZod = validatorEnabled ? driver.getPlugin(pluginZodName) : null
    const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : null

    const hasRequestBody = Boolean(node.requestBody?.content?.[0]?.schema)
    const importedTypeNames = [tsResolver.response.config(node), tsResolver.response.responses(node)]

    const importedZodNames = zodResolver
      ? [
          resolveResponseValidator(validator) === 'zod' ? zodResolver.response.response?.(node) : null,
          resolveResponseValidator(validator) === 'zod' ? (buildZodErrorParse(node, zodResolver)?.expression ?? null) : null,
          resolveRequestValidator(validator) === 'zod' && hasRequestBody ? zodResolver.response.body?.(node) : null,
        ].filter((name): name is string => Boolean(name))
      : []

    const meta = {
      name: resolver.name(node.operationId),
      file: resolver.file({ ...operationFileEntry(node, node.operationId), root, output, group: group ?? undefined }),
      fileTs: tsResolver.file({
        ...operationFileEntry(node, node.operationId),
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
      fileZod:
        zodResolver && pluginZod?.options
          ? zodResolver.file({
              ...operationFileEntry(node, node.operationId),
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
    const eventStream = isEventStream(node)

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name={eventStream ? ['client', 'toEventStream'] : ['client']} root={meta.file.path} path={clientPath} />
        <File.Import
          name={eventStream ? ['Options', 'EventStreamResult', 'SuccessOf'] : ['Options', 'RequestResult']}
          root={meta.file.path}
          path={clientPath}
          isTypeOnly
        />

        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        {meta.fileZod && importedZodNames.length > 0 && <File.Import name={importedZodNames} root={meta.file.path} path={meta.fileZod.path} />}

        <Operation name={meta.name} node={node} tsResolver={tsResolver} zodResolver={zodResolver} validator={validator} security={security} />
      </File>
    )
  },
})
