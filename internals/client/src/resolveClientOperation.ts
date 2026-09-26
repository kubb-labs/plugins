import path from 'node:path'
import { operationFileEntry } from '@internals/shared'
import type { ast, Exclude, Group, Include, NodeCache, Output, Override, Resolver } from 'kubb/kit'

/**
 * The resolved contract `<op>` for one operation: the generated function name, the file it lives in,
 * the contract runtime's `.kubb/client.ts` path (where `RequestConfig` / `ResponseErrorConfig`
 * come from), and the registered client plugin's `returnType`.
 */
export type ClientOperation = { name: string; path: string; clientPath: string; returnType: 'full' | 'data' }

/**
 * The client plugin options a dependent reads, including the filters that scope them per operation.
 */
type ClientPluginOptions = {
  output?: Output
  group?: Group | null
  returnType?: 'full' | 'data'
  exclude?: Array<Exclude>
  include?: Array<Include>
  override?: Array<Override<Omit<ClientPluginOptions, 'override'>>>
}

/**
 * Resolves the contract client `<op>` a consumer (query hook, MCP handler) imports, by looking up
 * the registered contract client plugin's resolver and output. Works for any contract client plugin
 * (plugin-fetch or plugin-axios). Returns `null` when no contract plugin is in play (the inline
 * path), or when the client plugin's `exclude` / `include` leaves this operation out, since it then
 * emits no `<op>` to import. The plugin injects `.kubb/client.ts` at the global output root, the
 * same path consumers read `RequestConfig` / `ResponseErrorConfig` from.
 *
 * The result is cached in the current node's `cache` (`ctx.cache`) under the client plugin's name,
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
  cache: NodeCache
}): ClientOperation | null {
  const { clientPlugin, driver, node, root, output, cache } = options
  if (!clientPlugin) return null

  return cache.ensureItem(`${clientPlugin.pluginName}:clientOperation`, () => {
    const resolver = driver.getResolver(clientPlugin.pluginName)
    const pluginOptions = driver.getPlugin(clientPlugin.pluginName)?.options ?? {}
    const { exclude, include, override } = pluginOptions
    const hasOperationOptions = Boolean(exclude?.length || include?.length || override?.length)
    // Kubb's resolver always has `default`; the fallback keeps partial or custom resolvers working.
    const operationOptions =
      hasOperationOptions && resolver.default
        ? resolver.default.options(node, { options: pluginOptions, exclude, include, override })
        : pluginOptions
    if (!operationOptions) return null

    const file = resolver.file({
      ...operationFileEntry(node, node.operationId),
      root,
      output: operationOptions.output ?? output,
      group: operationOptions.group ?? undefined,
    })

    return {
      name: resolver.name(node.operationId),
      path: file.path,
      clientPath: path.resolve(root, '.kubb/client.ts'),
      returnType: operationOptions.returnType ?? 'full',
    }
  })
}
