import { ast } from '@internals/ast'
import path from 'node:path'
import { getStream, namedFile } from '@internals/shared'
import { type OperationTypeSource, resolveOperationTypes, resultTypeName } from '@internals/client'
import { ensureValidVarName } from '@internals/utils'
import { code, defineTemplate, Diagnostics } from '@kubb/kit'
import type { FileTarget, Template } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import { type GeneratorContext, type OperationData, resolveOperationData } from '../builders/operationData.ts'
import { buildEventStreamImports } from '../builders/returnStatement.ts'
import { SdkClient } from '../components/SdkClient.tsx'
import { ClientRuntime } from '../components/ClientRuntime.tsx'
import { SdkFacade } from '../components/SdkFacade.tsx'
import type { ContractClientFactory } from '../types.ts'

type Controller = {
  name: string
  tag: string | undefined
  file: FileTarget
  operations: Array<OperationData>
}

/**
 * Groups operations into one controller per tag. Operations without a tag fall back to a single
 * `Client`/`ApiClient` controller, matching the resolver's default naming.
 */
function buildControllers(nodes: ReadonlyArray<ast.OperationNode>, ctx: GeneratorContext, types: OperationTypeSource): Array<Controller> {
  return nodes.reduce((acc, operationNode) => {
    if (!ast.http.isOperation(operationNode)) return acc
    const tag = operationNode.tags[0]
    const name = tag ? ensureValidVarName(ctx.resolver.groupName(tag)) : ctx.resolver.className('ApiClient')
    // `group.name` names the folder and file, never the class.
    const fileName = tag && ctx.options.group ? ensureValidVarName(path.basename(ctx.resolver.groupDir(ctx.options.group, tag))) : name
    const file = namedFile({ name: fileName, tag })
    const operationData = resolveOperationData({ node: operationNode, ctx, types })
    const previous = acc.find((item) => item.file.path === file.path)

    if (previous) {
      previous.operations.push(operationData)
    } else {
      acc.push({ name, tag, file, operations: [operationData] })
    }

    return acc
  }, [] as Array<Controller>)
}

/**
 * Builds the class-based SDK template for a client plugin (`@kubb/plugin-fetch`,
 * `@kubb/plugin-axios`). Only registered when `sdk` is set; otherwise the plugin keeps its
 * standalone per-operation functions.
 *
 * Every tag client is an instance class whose constructor takes a client config and builds its own
 * client, or takes an existing client, so each environment is a separate instance. With `sdk.mode:
 * 'tag'` (the default) it emits one class per tag, named by `resolver.groupName`, and, when `sdk.name`
 * is set, a composed root that creates one client and shares it with every tag client. With
 * `sdk.mode: 'flat'` it emits one class named by `sdk.name`, with every operation as a direct method.
 *
 * `templates` is the folder the optional runtime is copied from: `sse.ts` only for a document that streams, and each
 * form media type only for a document with a body of that type.
 */
export function createSdkTemplate<TFactory extends ContractClientFactory>({ templates }: { templates?: string } = {}): Template<TFactory> {
  return defineTemplate<TFactory>({
    kind: ast.node.kinds.operations,
    render({ operations: nodes }, ctx) {
      const { output, validator, returnType, throwOnErrorDefault, sdk } = ctx.options

      if (!sdk) return null

      // `resolver.file(...)` resolves every tag to the same single `output.path` under `mode:
      // 'file'`, so a tag-per-class split has nothing to split into: every tag would collapse
      // into whichever controller `buildControllers` reduces first, silently dropping the rest.
      if (sdk.mode === 'tag' && output.mode === 'file') {
        throw new Diagnostics.Error({
          code: Diagnostics.code.invalidPluginOptions,
          severity: 'error',
          message: `Plugin "${ctx.plugin.name}" resolves \`output.mode\` to 'file' but also configures \`sdk.mode: 'tag'\`.`,
          help: "A single-file output has nothing to split tag classes into. Set `sdk.mode: 'flat'` to emit one class into that file, or give `output.path` an extensionless directory name (or set `output.mode: 'directory'` explicitly) so each tag gets its own file.",
          location: { kind: 'config' },
          plugin: ctx.plugin.name,
        })
      }

      const types = resolveOperationTypes()

      const controllers = buildControllers(nodes, ctx, types)
      // `importPath` is written verbatim; the bundled runtime is made relative to each file.
      const { importPath } = ctx.options
      const clientPath = importPath ?? path.resolve(ctx.root, '.kubb/client.ts')
      const standardSchemaPath = importPath ?? path.resolve(ctx.root, '.kubb/standardSchema.ts')
      const importRoot = (file: string) => (importPath === undefined ? file : undefined)

      const renderClassFile = ({ name: className, file, operations: ops }: Pick<Controller, 'name' | 'file' | 'operations'>) => {
        const typeImports = code.join(ops.flatMap((op) => op.typeNames)).imports
        const schemaImports = code.join(ops.flatMap((op) => op.schemaNames)).imports
        const resultOps = ops.filter((op) => !getStream(op.node)?.shape)
        const typedHeaders = (op: OperationData) => op.headerTypeNames.length > 0
        const resultName = returnType === 'data' ? 'UnwrappedResult' : 'RequestResult'

        return (
          <File key={file.path} {...file}>
            <File.Import
              names={[
                ...[
                  'createClient',
                  returnType === 'data' ? 'unwrapResult' : 'withUnwrap',
                  'resolveThrowOnError',
                  ...(ops.some((op) => op.security) ? ['securitySchemes'] : []),
                ].map((name) => ({ name, space: 'value' as const })),
                ...Array.from(
                  new Set([
                    'ClientConfig',
                    'ClientInstance',
                    'Options',
                    ...(returnType === 'data' ? [] : ['Unwrappable']),
                    ...(resultOps.some((op) => !typedHeaders(op)) ? [resultName] : []),
                    ...(resultOps.some(typedHeaders) ? [resultTypeName(resultName, true)] : []),
                    ...ops.filter((op) => getStream(op.node)?.shape).flatMap((op) => buildEventStreamImports({ node: op.node, types: op.types, returnType })),
                  ]),
                  (name) => ({ name, space: 'type' as const }),
                ),
              ]}
              root={importRoot(file.path)}
              path={clientPath}
            />

            {validator === 'zod' && ops.some((op) => ast.http.requestBody.getSchema(op.node) != null) && (
              <File.Import names={[{ name: 'z', space: 'type' }]} path="zod" />
            )}

            {typeImports.map((imp) => (
              <File.Import key={imp.path} names={ast.imports.asType(imp)} root={file.path} path={imp.path} />
            ))}

            {schemaImports.map((imp) => (
              <File.Import key={imp.path} names={ast.file.getNames(imp)} root={file.path} path={imp.path} />
            ))}

            {ops.some((op) => op.validatorHooks.headers) && (
              <File.Import names={[{ name: 'toHeadersStandardSchema', space: 'value' }]} root={importRoot(file.path)} path={standardSchemaPath} />
            )}

            <SdkClient name={className} operations={ops} returnType={returnType} throwOnErrorDefault={throwOnErrorDefault} />
          </File>
        )
      }

      // `flat` collapses every operation into one class named by `sdk.name`, so callers reach
      // an operation as `new PetStore(config).getPetById(...)` without a per-tag sub-client.
      const renderFacadeFile = (name: string) => {
        const sdkFile = namedFile({ name })
        const members = controllers.map(({ name, tag }) => ({ className: name, propName: ctx.resolver.propertyName(tag ?? name) }))

        return (
          <File key={sdkFile.path} {...sdkFile}>
            <File.Import
              names={[
                { name: 'createClient', space: 'value' },
                { name: 'ClientConfig', space: 'type' },
                { name: 'ClientInstance', space: 'type' },
              ]}
              root={importRoot(sdkFile.path)}
              path={clientPath}
            />
            {controllers.map(({ name, file }) => (
              <File.Import key={name} names={[{ name, space: 'value' }]} root={sdkFile.path} path={file.path} />
            ))}
            <SdkFacade name={ctx.resolver.className(name)} members={members} />
          </File>
        )
      }

      const files =
        sdk.mode === 'flat'
          ? renderClassFile({
              name: ctx.resolver.className(sdk.name ?? 'sdk'),
              file: namedFile({ name: sdk.name ?? 'sdk' }),
              operations: controllers.flatMap((controller) => controller.operations),
            })
          : [...controllers.map(renderClassFile), sdk.name && renderFacadeFile(sdk.name)]

      return (
        <>
          <ClientRuntime nodes={nodes} root={ctx.root} templates={templates} baseURL={ctx.options.baseURL} servers={ctx.meta.servers} auth={ctx.meta.auth} />
          {files}
        </>
      )
    },
  })
}
