import path from 'node:path'
import { operationFileEntry, operationKey } from '@internals/shared'
import type { ast, Exclude, Group, Include, Memo, Output, Override, Resolver } from '@kubb/kit'
import type { ReturnTypeOption } from './types.ts'

/**
 * The resolved contract `<op>` for one operation: the generated function name, the file it lives in,
 * the client module path (where `RequestConfig` / `ResponseErrorConfig` come from), and the
 * registered client plugin's `returnType`.
 *
 * `clientPath` is the absolute `.kubb/client.ts` path for plugin-fetch / plugin-axios, or
 * plugin-client's `importPath`: a relative one is resolved against the `<op>` file to an absolute
 * path, a package name or alias is kept verbatim. `clientPathIsFile` tells a consumer whether to
 * make it relative to the importing file.
 */
export type ClientOperation = { name: string; path: string; clientPath: string; clientPathIsFile: boolean; returnType: ReturnTypeOption }

/**
 * The client plugin options a dependent reads, including the filters that scope them per operation.
 */
type ClientPluginOptions = {
  output?: Output
  group?: Group | null
  returnType?: ReturnTypeOption
  importPath?: string
  exclude?: Array<Exclude>
  include?: Array<Include>
  override?: Array<Override<Omit<ClientPluginOptions, 'override'>>>
}

function isRelativeImport(importPath: string): boolean {
  return importPath.startsWith('.')
}

// plugin-client resolves a relative `importPath` from its `<op>` file, so do the same here.
function resolveImportPath(options: { importPath: string; operationFile: string }): string {
  const { importPath, operationFile } = options
  return isRelativeImport(importPath) ? path.resolve(path.dirname(operationFile), importPath) : importPath
}

/**
 * Resolves the contract client `<op>` a consumer (query hook, MCP handler) imports, by looking up
 * the registered contract client plugin's resolver and output. Works for any contract client plugin
 * (plugin-fetch, plugin-axios, or plugin-client). Returns `null` when no contract plugin is in play (the inline
 * path), or when the client plugin's `exclude` / `include` leaves this operation out, since it then
 * emits no `<op>` to import. plugin-fetch / plugin-axios inject `.kubb/client.ts` at the global
 * output root, the same path consumers read `RequestConfig` / `ResponseErrorConfig` from.
 * With plugin-client they come from the user's `importPath` module instead.
 *
 * The result is cached in `memo` (the build's `ctx.memo`) under the client plugin's name and the operation,
 * so several dependents reading the same client plugin for one operation in a single pass
 * (react-query's query/mutation/infinite generators, vue-query, swr, the MCP handler, ...) share
 * one computed result instead of each re-deriving the name and path.
 *
 * `returnType`, `output`, and `group` are the client plugin's options for this operation, after its
 * `override` entries, the same resolution its own generator sees. A dependent's generated call body
 * and import path therefore match the `<op>` actually emitted, even when an `override` changes it.
 */
export function resolveClientOperation(options: {
  clientPlugin: { pluginName: string } | null
  driver: {
    getPlugin: (name: string) => { options?: ClientPluginOptions } | undefined
    getResolver: (name: string) => Resolver
  }
  node: ast.OperationNode
  root: string
  output: Output
  memo: Memo
}): ClientOperation | null {
  const { clientPlugin, driver, node, root, output, memo } = options
  if (!clientPlugin) return null

  return memo(`${clientPlugin.pluginName}:clientOperation:${node.operationId}`, () => {
    const resolver = driver.getResolver(clientPlugin.pluginName)
    const pluginOptions = driver.getPlugin(clientPlugin.pluginName)?.options ?? {}
    const { exclude, include, override } = pluginOptions
    const hasOperationOptions = Boolean(exclude?.length || include?.length || override?.length)
    // Kubb's resolver always has `default`; the fallback keeps partial or custom resolvers working.
    const operationOptions =
      hasOperationOptions && resolver.default ? resolver.default.options(node, { options: pluginOptions, exclude, include, override }) : pluginOptions
    if (!operationOptions) return null

    const file = resolver.file({
      ...operationFileEntry(node, node.operationId),
      root,
      output: operationOptions.output ?? output,
      group: operationOptions.group ?? undefined,
    })

    const { importPath } = operationOptions
    const name = resolver.name(node.operationId)

    return {
      name: resolver.resolveName({ key: operationKey(node), name }),
      path: file.path,
      clientPath: importPath === undefined ? path.resolve(root, '.kubb/client.ts') : resolveImportPath({ importPath, operationFile: file.path }),
      clientPathIsFile: importPath === undefined || isRelativeImport(importPath),
      returnType: operationOptions.returnType ?? 'full',
    }
  })
}
