import path from 'node:path'
import { operationFileEntry } from '@internals/shared'
import type { ast, Group, NodeCache, Output, Resolver } from 'kubb/kit'

/**
 * The resolved contract `<op>` for one operation: the generated function name, the file it lives in,
 * and the contract runtime's `.kubb/client.ts` path (where `RequestConfig` / `ResponseErrorConfig`
 * come from).
 */
export type ClientOperation = { name: string; path: string; clientPath: string }

/**
 * Resolves the contract client `<op>` a consumer (query hook, MCP handler) imports, by looking up
 * the registered contract client plugin's resolver and output. Works for any contract client plugin
 * (plugin-fetch or plugin-axios). Returns `null` when no contract plugin is in play (the inline
 * path). The plugin injects `.kubb/client.ts` at the global output root, the same path consumers
 * read `RequestConfig` / `ResponseErrorConfig` from.
 *
 * The result is cached in the current node's `cache` (`ctx.cache`) under the client plugin's name,
 * so several dependents reading the same client plugin for one operation in a single pass
 * (react-query's query/mutation/infinite generators, vue-query, swr, the MCP handler, ...) share
 * one computed result instead of each re-deriving the name and path.
 */
export function resolveClientOperation(options: {
  clientPlugin: { pluginName: string } | null
  driver: {
    getPlugin: (name: string) => { options?: { output?: Output; group?: Group | null } } | undefined
    getResolver: (name: string) => Resolver
  }
  node: ast.OperationNode
  root: string
  output: Output
  cache: NodeCache
}): ClientOperation | null {
  const { clientPlugin, driver, node, root, output, cache } = options
  if (!clientPlugin) return null

  return cache.getOrSet(`${clientPlugin.pluginName}:clientOperation`, () => {
    const resolver = driver.getResolver(clientPlugin.pluginName)
    const plugin = driver.getPlugin(clientPlugin.pluginName)
    const file = resolver.file({
      ...operationFileEntry(node, node.operationId),
      root,
      output: plugin?.options?.output ?? output,
      group: plugin?.options?.group ?? undefined,
    })

    return { name: resolver.name(node.operationId), path: file.path, clientPath: path.resolve(root, '.kubb/client.ts') }
  })
}
