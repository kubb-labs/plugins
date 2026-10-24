import { resolveTypeResolver } from '@internals/client'
import { operationFileEntry, resolveDependencyOperationFile, resolveOperationTypeNames } from '@internals/shared'
import type { ast, GeneratorContext, Group, Output } from 'kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { File } from 'kubb/jsx'
import type { KubbReactNode } from 'kubb/jsx'

type ContractOperation = { name: string; path: string; clientPath: string; clientPathIsFile: boolean }

type HookFileContext = Pick<GeneratorContext, 'config' | 'root' | 'cache' | 'meta' | 'driver' | 'requirePlugin' | 'resolver'>

type ResolveHookFileOptions = {
  name: string
  output: Output
  group?: Group | null
  contractOp: ContractOperation
  /**
   * The `<Key>` type alias declared in this file, left out of the imported type names.
   */
  keyTypeName?: string
  /**
   * Type names imported right after the response options type.
   */
  extraTypeNames?: Array<string | null | undefined>
}

type ResolvedHookFile = {
  file: ast.FileNode
  fileTs: ast.FileNode
  tsResolver: ResolverTs
  contractOp: ContractOperation
  importedTypeNames: Array<string>
  banner: string | null
  footer: string | null
}

/**
 * Resolves what every TanStack hook file shares: its file, the operation types file and names (`@kubb/plugin-ts`, or
 * `pluginZod({ inferred: 'direction' })`), banner and footer.
 */
export function resolveHookFile(node: ast.OperationNode, ctx: HookFileContext, options: ResolveHookFileOptions): ResolvedHookFile {
  const { name, output, group, contractOp, keyTypeName, extraTypeNames = [] } = options
  const { config, root, resolver } = ctx
  const types = resolveTypeResolver(ctx.driver)
  const tsResolver = types.resolver

  const file = resolver.file({ ...operationFileEntry(node, name), root, output, group: group ?? undefined })
  const fileTs = resolveDependencyOperationFile({
    cache: ctx.cache,
    node,
    resolver: tsResolver,
    root,
    output: types.output ?? output,
    group: types.group,
  })
  const importedTypeNames = [
    tsResolver.response.options(node),
    ...extraTypeNames,
    ...resolveOperationTypeNames(node, tsResolver, {
      exclude: keyTypeName ? [keyTypeName] : undefined,
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
  const { file, fileTs, contractOp, importedTypeNames, banner, footer } = hook

  return (
    <File baseName={file.baseName} path={file.path} meta={file.meta} banner={banner} footer={footer}>
      <File.Import name={[contractOp.name]} root={file.path} path={contractOp.path} />
      <File.Import
        name={['RequestConfig', 'ResponseErrorConfig']}
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
