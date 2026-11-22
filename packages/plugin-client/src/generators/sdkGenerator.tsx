import { ast } from '@internals/ast'
import path from 'node:path'
import { getStream } from '@internals/shared'
import { type OperationTypeSource, resolveOperationTypes, resultTypeName } from '@internals/client'
import { ensureValidVarName } from '@internals/utils'
import { code, defineGenerator, Diagnostics } from '@kubb/kit'
import type { Generator } from '@kubb/kit'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { type GeneratorContext, type OperationData, resolveOperationData } from '../builders/operationData.ts'
import { buildEventStreamImports } from '../builders/returnStatement.ts'
import { isValidatorEnabled } from '../builders/validatorOptions.ts'
import { SdkClient } from '../components/SdkClient.tsx'
import { ClientRuntime } from '../components/ClientRuntime.tsx'
import { SdkFacade } from '../components/SdkFacade.tsx'
import type { ContractClientFactory } from '../types.ts'

type Controller = {
  name: string
  tag: string | undefined
  file: ast.FileNode
  operations: Array<OperationData>
}

/**
 * Groups operations into one controller per tag. Operations without a tag fall back to a single
 * `Client`/`ApiClient` controller, matching the resolver's default naming.
 */
function buildControllers(nodes: ReadonlyArray<ast.OperationNode>, ctx: GeneratorContext, types: OperationTypeSource): Array<Controller> {
  const { output, group } = ctx.options

  return nodes.reduce((acc, operationNode) => {
    if (!ast.http.isOperation(operationNode)) return acc
    const tag = operationNode.tags[0]
    const name = tag ? ensureValidVarName(ctx.resolver.groupName(tag)) : ctx.resolver.className('ApiClient')
    // `group.name` names the folder and file, never the class.
    const fileName = tag && group ? ensureValidVarName(path.basename(ctx.resolver.groupDir(group, tag))) : name
    const file = ctx.resolver.file({ name: fileName, extname: '.ts', tag, root: ctx.root, output, group: group ?? undefined })
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
 * Builds the class-based SDK generator for a client plugin (`@kubb/plugin-fetch`,
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
export function createSdkGenerator<TFactory extends ContractClientFactory>({ templates }: { templates?: string } = {}): Generator<TFactory> {
  return defineGenerator<TFactory>({
    name: 'sdk',
    renderer: jsxRenderer,
    operations(nodes, ctx) {
      const { output, group, validator, returnType, throwOnErrorDefault, sdk } = ctx.options

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

      const validatorEnabled = isValidatorEnabled(validator)
      const controllers = buildControllers(nodes, ctx, types)
      const clientPath = path.resolve(ctx.root, '.kubb/client.ts')
      const standardSchemaPath = path.resolve(ctx.root, '.kubb/standardSchema.ts')

      const banner = (file: ast.FileNode) => ctx.resolver.default.banner(ctx.meta, { output, config: ctx.config, file: { path: file.path, baseName: file.baseName } })
      const footer = (file: ast.FileNode) => ctx.resolver.default.footer(ctx.meta, { output, config: ctx.config, file: { path: file.path, baseName: file.baseName } })

      const renderClassFile = (className: string, file: ast.FileNode, ops: Array<OperationData>) => {
        const typeImports = code.join(ops.flatMap((op) => op.typeNames)).imports
        const schemaImports = validatorEnabled ? code.join(ops.flatMap((op) => op.schemaNames)).imports : []
        const resultOps = ops.filter((op) => !getStream(op.node)?.shape)
        const typedHeaders = (op: OperationData) => op.headerTypeNames.length > 0
        const resultName = returnType === 'data' ? 'UnwrappedResult' : 'RequestResult'

        return (
          <File key={file.path} baseName={file.baseName} path={file.path} meta={file.meta} banner={banner(file)} footer={footer(file)}>
            <File.Import
              name={[
                'createClient',
                returnType === 'data' ? 'unwrapResult' : 'withUnwrap',
                'resolveThrowOnError',
                ...(ctx.options.importPath === undefined && ops.some((op) => op.security) ? ['securitySchemes'] : []),
              ]}
              root={file.path}
              path={clientPath}
            />
            <File.Import
              name={Array.from(
                new Set([
                  'ClientConfig',
                  'ClientInstance',
                  'Options',
                  ...(returnType === 'data' ? [] : ['Unwrappable']),
                  ...(resultOps.some((op) => !typedHeaders(op)) ? [resultName] : []),
                  ...(resultOps.some(typedHeaders) ? [resultTypeName(resultName, true)] : []),
                  ...ops.filter((op) => getStream(op.node)?.shape).flatMap((op) => buildEventStreamImports({ node: op.node, types: op.types, returnType })),
                ]),
              )}
              root={file.path}
              path={clientPath}
              isTypeOnly
            />

            {validator === 'zod' && ops.some((op) => ast.http.requestBody.getSchema(op.node) != null) && <File.Import name={['z']} path="zod" isTypeOnly />}

            {typeImports.map((imp) => (
              <File.Import key={imp.path} name={imp.name} root={file.path} path={imp.path} isTypeOnly />
            ))}

            {schemaImports.map((imp) => (
              <File.Import key={imp.path} name={imp.name} root={file.path} path={imp.path} />
            ))}

            {ops.some((op) => op.validatorHooks.headers) && <File.Import name={['toHeadersStandardSchema']} root={file.path} path={standardSchemaPath} />}

            <SdkClient name={className} operations={ops} returnType={returnType} throwOnErrorDefault={throwOnErrorDefault} />
          </File>
        )
      }

      // `flat` collapses every operation into one class named by `sdk.name`, so callers reach
      // an operation as `new PetStore(config).getPetById(...)` without a per-tag sub-client.
      const renderFacadeFile = (name: string) => {
        const sdkFile = ctx.resolver.file({ name, extname: '.ts', root: ctx.root, output, group: group ?? undefined })
        const members = controllers.map(({ name, tag }) => ({ className: name, propName: ctx.resolver.propertyName(tag ?? name) }))

        return (
          <File key={sdkFile.path} baseName={sdkFile.baseName} path={sdkFile.path} meta={sdkFile.meta} banner={banner(sdkFile)} footer={footer(sdkFile)}>
            <File.Import name={['createClient']} root={sdkFile.path} path={clientPath} />
            <File.Import name={['ClientConfig', 'ClientInstance']} root={sdkFile.path} path={clientPath} isTypeOnly />
            {controllers.map(({ name, file }) => (
              <File.Import key={name} name={[name]} root={sdkFile.path} path={file.path} />
            ))}
            <SdkFacade name={ctx.resolver.className(name)} members={members} />
          </File>
        )
      }

      const files =
        sdk.mode === 'flat'
          ? renderClassFile(
              ctx.resolver.className(sdk.name ?? 'sdk'),
              ctx.resolver.file({ name: sdk.name ?? 'sdk', extname: '.ts', root: ctx.root, output, group: group ?? undefined }),
              controllers.flatMap((controller) => controller.operations),
            )
          : [...controllers.map(({ name, file, operations: ops }) => renderClassFile(name, file, ops)), sdk.name && renderFacadeFile(sdk.name)]

      return (
        <>
          <ClientRuntime nodes={nodes} root={ctx.root} templates={templates} baseURL={ctx.options.baseURL} servers={ctx.meta.servers} auth={ctx.meta.auth} />
          {files}
        </>
      )
    },
  })
}
