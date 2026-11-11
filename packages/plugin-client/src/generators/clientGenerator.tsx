import path from 'node:path'
import { resolveOperationTypes, resultTypeName } from '@internals/client'
import { getEventStream, operationFileEntry } from '@internals/shared'
import { ast, defineGenerator } from '@kubb/kit'
import type { Generator } from '@kubb/kit'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { resolveOperationData } from '../builders/operationData.ts'
import { buildEventStreamImports } from '../builders/returnStatement.ts'
import { Operation } from '../components/Operation.tsx'
import { ClientRuntime } from '../components/ClientRuntime.tsx'
import type { ContractClientFactory } from '../types.ts'

/**
 * Builds the per-operation client generator shared by the client plugins. `templates` is the folder the optional runtime, such as `sse.ts`, is copied from.
 */
export function createClientGenerator<TFactory extends ContractClientFactory>(name: string, { templates }: { templates?: string } = {}): Generator<TFactory> {
  return defineGenerator<TFactory>({
    name,
    renderer: jsxRenderer,
    operations(nodes, ctx) {
      return <ClientRuntime nodes={nodes} root={ctx.root} templates={templates} baseURL={ctx.options.baseURL} servers={ctx.meta.servers} auth={ctx.meta.auth} />
    },
    operation(node, ctx) {
      if (!ast.isHttpOperationNode(node)) return null

      const { config, driver, resolver, root } = ctx
      const { output, returnType, throwOnErrorDefault, group, importPath } = ctx.options

      const resolvedTypes = resolveOperationTypes(driver, ctx.plugin.name)
      // A custom client module keeps the two-argument `RequestResult` it documents, so its results get no typed headers.
      const types = importPath === undefined ? resolvedTypes : { ...resolvedTypes, response: { ...resolvedTypes.response, headers: undefined } }

      const data = resolveOperationData({ node, ctx, types })
      const { validatorHooks, headerTypeNames } = data
      const file = resolver.file({ ...operationFileEntry(node, node.operationId), root, output, group: group ?? undefined })
      const importedTypeNames = [types.response.options(node), types.response.responses(node), ...headerTypeNames]

      // A custom client module is emitted verbatim, so `importPath` is used exactly as configured.
      // The default `.kubb/client.ts` is a file path and is made relative to the operation file.
      const clientPath = importPath ?? path.resolve(root, '.kubb/client.ts')
      const clientRoot = importPath === undefined ? file.path : undefined
      // The headers validator helper ships in `.kubb/standardSchema.ts`; a custom client module exports it
      // alongside its other runtime helpers.
      const standardSchemaPath = importPath ?? path.resolve(root, '.kubb/standardSchema.ts')
      const stream = getEventStream(node)

      const clientValueImports = [
        ...{
          plain: ['client'],
          data: ['client', 'unwrapResult', 'resolveThrowOnError'],
          full: ['client', 'withUnwrap', 'resolveThrowOnError'],
        }[returnType],
        ...(importPath === undefined && data.security ? ['securitySchemes'] : []),
      ]

      const clientTypeImports = stream
        ? buildEventStreamImports({ node, types, returnType })
        : { plain: ['Options', 'RequestResult'], data: ['Options', 'UnwrappedResult'], full: ['Options', 'Unwrappable', 'RequestResult'] }[returnType].map(
            (name) => (name.endsWith('Result') ? resultTypeName(name, headerTypeNames.length) : name),
          )

      return (
        <File
          baseName={file.baseName}
          path={file.path}
          meta={file.meta}
          banner={resolver.default.banner(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })}
          footer={resolver.default.footer(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })}
        >
          <File.Import name={clientValueImports} root={clientRoot} path={clientPath} />
          <File.Import name={clientTypeImports} root={clientRoot} path={clientPath} isTypeOnly />

          <File.Import name={Array.from(new Set(importedTypeNames))} root={file.path} path={data.typeFile.path} isTypeOnly />

          {data.zodFile && validatorHooks.importedZodNames.length > 0 && (
            <File.Import name={validatorHooks.importedZodNames} root={file.path} path={data.zodFile.path} />
          )}
          {validatorHooks.headers && <File.Import name={['toHeadersStandardSchema']} root={clientRoot} path={standardSchemaPath} />}

          <Operation
            name={data.name}
            node={node}
            types={types}
            validatorHooks={validatorHooks}
            returnType={returnType}
            throwOnErrorDefault={throwOnErrorDefault}
            security={data.security}
            baseURL={data.baseURL}
          />
        </File>
      )
    },
  })
}
