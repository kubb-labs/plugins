import type { ast } from '@internals/ast'
import { getResponseHeadersTypeNames, resolveOperationTypes } from '@internals/client'
import { operationFileEntry, resolveOperationTypeNames } from '@internals/shared'
import { Diagnostics, type FileTarget, type GeneratorContext, type Group, type Output, useKubb } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import type { ClientOperation, ReturnTypeOption } from '@internals/client'

type ResolveHookFileOptions = {
  name: string
  output: Output
  group?: Group | null
  contractOp: ClientOperation
  /**
   * The `<Key>` type alias declared in this file, left out of the imported type names.
   */
  keyTypeName?: string
  /**
   * Type names imported right after the response options type.
   */
  extraTypeNames?: Array<string | null | undefined>
  returnType?: ReturnTypeOption
}

type ResolvedHookFile = {
  file: ast.FileNode
  fileTs: FileTarget
  tsResolver: ResolverTs
  contractOp: ClientOperation
  importedTypeNames: Array<string>
  /**
   * The client's result type the hook names with `returnType: 'full'`.
   */
  resultTypeName: 'RequestResult' | 'RequestResultWithHeaders'
  returnType: ReturnTypeOption
  banner: string | null
  footer: string | null
}

/**
 * Resolves what every TanStack hook file shares: its file, the operation types file and names (`@kubb/plugin-ts`, or
 * `pluginZod({ inferred: 'codec' })`), banner and footer.
 */
export function resolveHookFile(node: ast.OperationNode, options: ResolveHookFileOptions): ResolvedHookFile {
  const ctx = useKubb<GeneratorContext>()
  const { name, output, group, contractOp, keyTypeName, extraTypeNames = [], returnType = 'data' } = options
  const { config, root, resolver } = ctx
  if (returnType !== 'data' && contractOp.returnType === 'data') {
    throw new Diagnostics.Error({
      code: Diagnostics.code.invalidPluginOptions,
      severity: 'error',
      message: `Option \`returnType\` is '${returnType}' for ${node.operationId}, but the client plugin has \`returnType: 'data'\` and only returns the response body.`,
      help: "Set the client plugin's `returnType` to 'full', or set the hook plugin's `returnType` to 'data'.",
      location: { kind: 'config' },
      plugin: resolver.pluginName,
    })
  }
  const types = resolveOperationTypes()
  const tsResolver = types.resolver
  const headerTypeNames = returnType === 'data' || !contractOp.typedHeaders ? [] : getResponseHeadersTypeNames({ node, types: tsResolver })

  const file = resolver.file({ ...operationFileEntry(node, name), root, output, group: group ?? undefined })
  const fileTs = ctx.file(node, { plugin: tsResolver.pluginName })
  const importedTypeNames = [
    tsResolver.response.options(node),
    tsResolver.response.responses(node),
    ...headerTypeNames,
    ...extraTypeNames,
    ...resolveOperationTypeNames(node, tsResolver, {
      // The full result only names error statuses (in ResponseErrorConfig); success statuses are unused.
      responseStatusNames: returnType === 'data' ? undefined : 'error',
      // The joined response alias is unused with the full result, and the printer keeps it as a substring of the responses record name.
      exclude: [keyTypeName, returnType !== 'data' ? tsResolver.response.response(node) : null].filter((name): name is string => Boolean(name)),
      order: 'body-response-first',
      includeParams: false,
    }),
  ].filter((typeName): typeName is string => Boolean(typeName))
  const fileMeta = { path: file.path, baseName: file.baseName }

  return {
    file,
    fileTs,
    tsResolver,
    contractOp,
    importedTypeNames,
    resultTypeName: headerTypeNames.length ? 'RequestResultWithHeaders' : 'RequestResult',
    returnType,
    banner: resolver.default.banner(ctx.meta, { output, config, file: fileMeta }),
    footer: resolver.default.footer(ctx.meta, { output, config, file: fileMeta }),
  }
}

type HookFileProps = {
  hook: ResolvedHookFile
  /**
   * Framework imports rendered between the client imports and the type import.
   */
  imports?: KubbReactNode
  children?: KubbReactNode
}

/**
 * The `<File>` shell shared by the TanStack hook generators; renders `children` after the imports.
 */
export function HookFile({ hook, imports, children }: HookFileProps): KubbReactNode {
  const { file, fileTs, contractOp, importedTypeNames, resultTypeName, banner, footer } = hook

  return (
    <File baseName={file.baseName} path={file.path} meta={file.meta} banner={banner} footer={footer}>
      <File.Import name={[contractOp.name]} root={file.path} path={contractOp.path} />
      <File.Import
        name={['RequestConfig', 'ResponseErrorConfig', resultTypeName]}
        root={contractOp.clientPathIsFile ? file.path : undefined}
        path={contractOp.clientPath}
        isTypeOnly
      />

      {imports}
      {fileTs && importedTypeNames.length > 0 && <File.Import name={Array.from(new Set(importedTypeNames))} root={file.path} path={fileTs.path} isTypeOnly />}

      {children}
    </File>
  )
}
