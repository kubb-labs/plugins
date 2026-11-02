import { resolveOperationTypes } from '@internals/client'
import { operationFileEntry, resolveDependencyOperationFile, resolveOperationTypeNames } from '@internals/shared'
import type { ast, GeneratorContext, Group, Output } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import type { DataReturn } from '../types.ts'

type ContractOperation = { name: string; path: string; clientPath: string; clientPathIsFile: boolean }

type HookFileContext = Pick<GeneratorContext, 'config' | 'root' | 'memo' | 'meta' | 'driver' | 'requirePlugin' | 'resolver'>

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
  data?: DataReturn
}

type ResolvedHookFile = {
  file: ast.FileNode
  fileTs: ast.FileNode
  tsResolver: ResolverTs
  contractOp: ContractOperation
  importedTypeNames: Array<string>
  data: DataReturn
  banner: string | null
  footer: string | null
}

/**
 * Resolves what every TanStack hook file shares: its file, the operation types file and names (`@kubb/plugin-ts`, or
 * `pluginZod({ inferred: 'codec' })`), banner and footer.
 */
export function resolveHookFile(node: ast.OperationNode, ctx: HookFileContext, options: ResolveHookFileOptions): ResolvedHookFile {
  const { name, output, group, contractOp, keyTypeName, extraTypeNames = [], data = 'body' } = options
  const { config, root, resolver } = ctx
  const types = resolveOperationTypes(ctx.driver, resolver.pluginName)
  const tsResolver = types.resolver

  const file = resolver.file({ ...operationFileEntry(node, name), root, output, group: group ?? undefined })
  const fileTs = resolveDependencyOperationFile({
    memo: ctx.memo,
    node,
    resolver: tsResolver,
    root,
    output: types.output ?? output,
    group: types.group,
  })
  const importedTypeNames = [
    tsResolver.response.options(node),
    data === 'full' ? tsResolver.response.responses(node) : null,
    ...extraTypeNames,
    ...resolveOperationTypeNames(node, tsResolver, {
      // The joined response alias is unused with the full result, and the printer keeps it as a substring of the responses record name.
      exclude: [keyTypeName, data === 'full' ? tsResolver.response.response(node) : null].filter((name): name is string => Boolean(name)),
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
    data,
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
  const { file, fileTs, contractOp, importedTypeNames, data, banner, footer } = hook

  return (
    <File baseName={file.baseName} path={file.path} meta={file.meta} banner={banner} footer={footer}>
      <File.Import name={[contractOp.name]} root={file.path} path={contractOp.path} />
      <File.Import
        name={data === 'full' ? ['RequestConfig', 'ResponseErrorConfig', 'RequestResult'] : ['RequestConfig', 'ResponseErrorConfig']}
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
