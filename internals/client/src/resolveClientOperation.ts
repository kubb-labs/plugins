import path from 'node:path'
import { operationFileEntry } from '@internals/shared'
import type { ast, Group, Output } from 'kubb/kit'

/**
 * The resolved contract `<op>` for one operation: the generated function name, the file it lives in,
 * and the contract runtime's `.kubb/client.ts` path (where `RequestConfig` / `ResponseErrorConfig`
 * come from).
 */
export type ClientOperation = { name: string; path: string; clientPath: string }

type ClientResolver = {
  resolveName: (name: string) => string
  core: {
    file: (entry: ReturnType<typeof operationFileEntry>, options: { root: string; output: Output; group?: Group }) => { path: string }
  }
}

/**
 * Resolves the contract client `<op>` a consumer (query hook, MCP handler) imports, by looking up
 * the registered contract client plugin's resolver and output. Works for any contract client plugin
 * (plugin-fetch or plugin-axios). Returns `null` when no contract plugin is in play (the inline
 * path). The plugin injects `.kubb/client.ts` at the global output root, the same path consumers
 * read `RequestConfig` / `ResponseErrorConfig` from.
 */
export function resolveClientOperation(options: {
  clientPlugin: { pluginName: string } | null
  driver: { getPlugin: (name: string) => unknown; getResolver: (name: string) => unknown }
  node: ast.OperationNode
  root: string
  output: Output
}): ClientOperation | null {
  const { clientPlugin, driver, node, root, output } = options
  if (!clientPlugin) return null

  const resolver = driver.getResolver(clientPlugin.pluginName) as ClientResolver | null | undefined
  if (!resolver) return null

  const plugin = driver.getPlugin(clientPlugin.pluginName) as { options?: { output?: Output; group?: Group | null } } | null | undefined
  const file = resolver.core.file(operationFileEntry(node, node.operationId), {
    root,
    output: plugin?.options?.output ?? output,
    group: plugin?.options?.group ?? undefined,
  })

  return { name: resolver.resolveName(node.operationId), path: file.path, clientPath: path.resolve(root, '.kubb/client.ts') }
}
