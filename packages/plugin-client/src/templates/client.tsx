import { ast } from '@internals/ast'
import path from 'node:path'
import { resolveOperationTypes, resultTypeName } from '@internals/client'
import { getStream } from '@internals/shared'
import { code, defineTemplate } from '@kubb/kit'
import type { Template } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import { resolveOperationData } from '../builders/operationData.ts'
import { buildEventStreamImports } from '../builders/returnStatement.ts'
import { Operation } from '../components/Operation.tsx'
import { ClientRuntime } from '../components/ClientRuntime.tsx'
import type { ContractClientFactory } from '../types.ts'

/**
 * Builds the client templates shared by the client plugins: one file per operation and the runtime the files import. `templates` is the folder the optional runtime, such as `sse.ts`, is copied from.
 * Without `templates`, as in `@kubb/plugin-client`, the module at `importPath` is a custom client that exports no `securitySchemes` or typed headers.
 */
export function createClientTemplates<TFactory extends ContractClientFactory>({ templates }: { templates?: string } = {}): [
  runtime: Template<TFactory>,
  operation: Template<TFactory>,
] {
  return [
    defineTemplate<TFactory>({
      kind: ast.node.kinds.operations,
      render({ operations: nodes }, ctx) {
        return (
          <ClientRuntime nodes={nodes} root={ctx.root} templates={templates} baseURL={ctx.options.baseURL} servers={ctx.meta.servers} auth={ctx.meta.auth} />
        )
      },
    }),
    defineTemplate<TFactory>({
      kind: ast.node.kinds.operation,
      render(node, ctx) {
        if (!ast.http.isOperation(node)) return null

        const { returnType, throwOnErrorDefault, importPath } = ctx.options
        const custom = templates === undefined

        const resolvedTypes = resolveOperationTypes()
        // A custom client module keeps the two-argument `RequestResult` it documents, so its results get no typed headers.
        const types = custom ? { ...resolvedTypes, response: { ...resolvedTypes.response, headers: undefined } } : resolvedTypes

        const data = resolveOperationData({ node, ctx, types, custom })
        const { validatorHooks, headerTypeNames } = data
        const file = ctx.file(node)

        // A custom client module is emitted verbatim, so `importPath` is used exactly as configured.
        // The default `.kubb/client.ts` is a file path and is made relative to the operation file.
        const clientPath = importPath ?? path.resolve(ctx.root, '.kubb/client.ts')
        const clientRoot = importPath === undefined ? file.path : undefined
        // The headers validator helper ships in `.kubb/standardSchema.ts`; only a custom client module exports it itself.
        const standardSchemaPath = custom && importPath ? importPath : path.resolve(ctx.root, '.kubb/standardSchema.ts')
        const standardSchemaRoot = custom && importPath ? undefined : file.path
        const stream = getStream(node)?.shape ?? null

        const clientValueImports = [
          ...{
            plain: ['client'],
            data: ['client', 'unwrapResult', 'resolveThrowOnError'],
            full: ['client', 'withUnwrap', 'resolveThrowOnError'],
          }[returnType],
          ...(!custom && data.security ? ['securitySchemes'] : []),
        ]

        const clientTypeImports = stream
          ? buildEventStreamImports({ node, types, returnType })
          : { plain: ['Options', 'RequestResult'], data: ['Options', 'UnwrappedResult'], full: ['Options', 'Unwrappable', 'RequestResult'] }[returnType].map(
              (name) => (name.endsWith('Result') ? resultTypeName(name, headerTypeNames.length > 0) : name),
            )

        return (
          <File {...file}>
            <File.Import
              names={[
                ...clientValueImports.map((name) => ({ name, space: 'value' as const })),
                ...clientTypeImports.map((name) => ({ name, space: 'type' as const })),
              ]}
              root={clientRoot}
              path={clientPath}
            />

            {code.join(data.typeNames).imports.map((imp) => (
              <File.Import key={imp.path} names={ast.imports.asType(imp)} root={file.path} path={imp.path} />
            ))}
            {code.join(data.schemaNames).imports.map((imp) => (
              <File.Import key={imp.path} names={ast.file.getNames(imp)} root={file.path} path={imp.path} />
            ))}
            {validatorHooks.headers && (
              <File.Import names={[{ name: 'toHeadersStandardSchema', space: 'value' }]} root={standardSchemaRoot} path={standardSchemaPath} />
            )}

            <Operation
              name={data.name}
              node={node}
              types={types}
              validatorHooks={validatorHooks}
              returnType={returnType}
              throwOnErrorDefault={throwOnErrorDefault}
              security={data.security}
              authRequired={data.authRequired}
              baseURL={data.baseURL}
            />
          </File>
        )
      },
    }),
  ]
}
