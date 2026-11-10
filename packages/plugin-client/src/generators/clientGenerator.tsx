import path from 'node:path'
import { resolveOperationTypes } from '@internals/client'
import { getEventStream, operationFileEntry, operationKey, resolveOperationFile } from '@internals/shared'
import { ast, defineGenerator } from '@kubb/kit'
import type { Generator } from '@kubb/kit'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { buildEventStreamImports } from '../builders/returnStatement.ts'
import { isValidatorEnabled } from '../builders/validatorOptions.ts'
import { getOperationSecurity, type SecurityDocument } from '../builders/security.ts'
import { getOperationBaseURL, type ServerDocument, type ServerOptions } from '../builders/server.ts'
import { buildValidatorHooks } from '../builders/validator.ts'
import { Operation } from '../components/Operation.tsx'
import { StreamRuntime } from '../components/StreamRuntime.tsx'
import type { ContractClientFactory } from '../types.ts'

/**
 * Builds the per-operation client generator shared by the client plugins. `sse` is the template copied into `.kubb/sse.ts` for a streaming document.
 */
export function createClientGenerator<TFactory extends ContractClientFactory>(name: string, { sse }: { sse?: string } = {}): Generator<TFactory> {
  return defineGenerator<TFactory>({
    name,
    renderer: jsxRenderer,
    operations(nodes, ctx) {
      return <StreamRuntime nodes={nodes} root={ctx.root} sse={sse} baseURL={ctx.options.baseURL} />
    },
    operation(node, ctx) {
      if (!ast.isHttpOperationNode(node)) return null

      const { config, driver, resolver, root } = ctx
      const { output, validator, returnType, throwOnErrorDefault, group, importPath } = ctx.options

      const types = resolveOperationTypes(driver, ctx.plugin.name)

      const pluginZod = isValidatorEnabled(validator) ? driver.getPlugin(pluginZodName) : null
      const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : null

      const importedTypeNames = [types.response.options(node), types.response.responses(node)]

      const validatorHooks = buildValidatorHooks({ node, validator, zodResolver })
      const importedZodNames = validatorHooks.importedZodNames
      const operationName = resolver.name(node.operationId)

      const meta = {
        name: resolver.resolveName({ key: operationKey(node), name: operationName }),
        file: resolver.file({ ...operationFileEntry(node, node.operationId), root, output, group: group ?? undefined }),
        fileTypes: resolveOperationFile({
          memo: ctx.memo,
          schemas: ctx.driver.inputNode?.schemas,
          node,
          resolver: types.resolver,
          root,
          output: types.output ?? output,
          group: types.group,
        }),
        fileZod:
          zodResolver && pluginZod?.options
            ? resolveOperationFile({
                memo: ctx.memo,
                schemas: ctx.driver.inputNode?.schemas,
                node,
                resolver: zodResolver,
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
      const baseURL = getOperationBaseURL({
        document: ctx.adapter.document as ServerDocument | null | undefined,
        method: node.method,
        path: node.path,
        server: (ctx.adapter.options as { server?: ServerOptions } | undefined)?.server,
      })

      // A custom client module is emitted verbatim, so `importPath` is used exactly as configured.
      // The default `.kubb/client.ts` is a file path and is made relative to the operation file.
      const clientPath = importPath ?? path.resolve(root, '.kubb/client.ts')
      const clientRoot = importPath === undefined ? meta.file.path : undefined
      // The headers validator helper ships in `.kubb/standardSchema.ts`; a custom client module exports it
      // alongside its other runtime helpers.
      const standardSchemaPath = importPath ?? path.resolve(root, '.kubb/standardSchema.ts')
      const stream = getEventStream(node)

      const clientValueImports = {
        plain: ['client'],
        data: ['client', 'unwrapResult', 'resolveThrowOnError'],
        full: ['client', 'withUnwrap', 'resolveThrowOnError'],
      }[returnType]

      const clientTypeImports = stream
        ? buildEventStreamImports({ returnType, typed: stream === 'event', line: stream === 'line' })
        : { plain: ['Options', 'RequestResult'], data: ['Options', 'UnwrappedResult'], full: ['Options', 'Unwrappable', 'RequestResult'] }[returnType]

      return (
        <File
          baseName={meta.file.baseName}
          path={meta.file.path}
          meta={meta.file.meta}
          banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
          footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        >
          <File.Import name={clientValueImports} root={clientRoot} path={clientPath} />
          <File.Import name={clientTypeImports} root={clientRoot} path={clientPath} isTypeOnly />

          {meta.fileTypes && importedTypeNames.length > 0 && (
            <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTypes.path} isTypeOnly />
          )}

          {meta.fileZod && importedZodNames.length > 0 && <File.Import name={importedZodNames} root={meta.file.path} path={meta.fileZod.path} />}
          {validatorHooks.headers && <File.Import name={['toHeadersStandardSchema']} root={clientRoot} path={standardSchemaPath} />}

          <Operation
            name={meta.name}
            node={node}
            types={types}
            validatorHooks={validatorHooks}
            returnType={returnType}
            throwOnErrorDefault={throwOnErrorDefault}
            security={security}
            baseURL={baseURL}
          />
        </File>
      )
    },
  })
}
