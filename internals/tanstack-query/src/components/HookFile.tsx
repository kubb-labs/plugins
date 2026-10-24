import { resolveOperationTypes } from '@internals/client'
import { groupOperationTypeImports, operationFileEntry, resolveDependencyOperationFile, resolveOperationTypeNames } from '@internals/shared'
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
  tsResolver: ResolverTs
  contractOp: ContractOperation
  typeImports: Array<{ path: string; names: Array<string> }>
  banner: string | null
  footer: string | null
}

/**
 * Resolves what every TanStack hook file shares: its file, the operation types file and names (`@kubb/plugin-ts`, or
 * `pluginZod({ inferred: 'codec' })`), banner and footer.
 */
export function resolveHookFile(node: ast.OperationNode, ctx: HookFileContext, options: ResolveHookFileOptions): ResolvedHookFile {
  const { name, output, group, contractOp, keyTypeName, extraTypeNames = [] } = options
  const { config, root, resolver } = ctx
  const types = resolveOperationTypes(ctx.driver, resolver.pluginName)
  const tsResolver = types.resolver

  const file = resolver.file({ ...operationFileEntry(node, name), root, output, group: group ?? undefined })
  const typesOutput = types.output ?? output
  const fileTs = resolveDependencyOperationFile({
    cache: ctx.cache,
    node,
    resolver: tsResolver,
    root,
    output: typesOutput,
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
  const typeImports = groupOperationTypeImports(node, importedTypeNames, { resolver: tsResolver, file: fileTs, root, output: typesOutput, group: types.group })
  const fileMeta = { path: file.path, baseName: file.baseName }

  return {
    file,
    tsResolver,
    contractOp,
    typeImports,
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
  const { file, contractOp, typeImports, banner, footer } = hook

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
      {typeImports.map((imp) => (
        <File.Import key={imp.path} name={imp.names} root={file.path} path={imp.path} isTypeOnly />
      ))}

      {children}
    </File>
  )
}
