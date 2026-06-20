/**
 * Resolves which client a query plugin (react-query, vue-query, swr) should call for an operation,
 * shared by all three so the selection rules and diagnostics stay in one place.
 *
 * The query plugins accept an additive `client` option: the string `'fetch'` / `'axios'` selects a
 * slim client plugin, while the deprecated object form keeps the legacy inline / plugin-client
 * behavior. When `client` is unset the registered plugins are inspected so a lone slim plugin is
 * picked up automatically.
 */

// Canonical plugin names. They mirror the `pluginFetchName` / `pluginAxiosName` / `pluginClientName`
// consts the plugins export, kept as literals so this internal needs no plugin install deps.
const pluginFetchName = 'plugin-fetch'
const pluginAxiosName = 'plugin-axios'
const pluginClientName = 'plugin-client'

/**
 * The client selector accepted by a query plugin's `client` option (string form).
 */
export type ClientSelector = 'fetch' | 'axios'

/**
 * The outcome of {@link resolveClient}. `slim` names the slim plugin whose `<op>` functions the hooks
 * import; `legacy` keeps today's inline / plugin-client generation; `error` carries a setup diagnostic.
 */
export type ResolveClientResult = { kind: 'slim'; pluginName: string } | { kind: 'legacy' } | { kind: 'error'; message: string }

const selectorToPlugin: Record<ClientSelector, string> = {
  fetch: pluginFetchName,
  axios: pluginAxiosName,
}

/**
 * Applies the additive `client` resolution rules. See the module comment for the option shape.
 *
 * @example
 * ```ts
 * resolveClient({ client: 'fetch', pluginNames: ['plugin-ts', 'plugin-fetch'] })
 * // { kind: 'slim', pluginName: 'plugin-fetch' }
 * ```
 */
export function resolveClient(options: { client: ClientSelector | object | undefined; pluginNames: ReadonlyArray<string> }): ResolveClientResult {
  const { client, pluginNames } = options
  const has = (name: string) => pluginNames.includes(name)

  if (client === 'fetch' || client === 'axios') {
    const pluginName = selectorToPlugin[client]
    if (!has(pluginName)) {
      return {
        kind: 'error',
        message: `\`client: '${client}'\` is set but \`@kubb/plugin-${client}\` is not registered in \`plugins\`. Add it, or drop \`client\` to use a different client plugin.`,
      }
    }
    return { kind: 'slim', pluginName }
  }

  // The deprecated object form keeps the legacy inline / plugin-client generation untouched.
  if (client && typeof client === 'object') {
    return { kind: 'legacy' }
  }

  // `client` unset: an explicit plugin-client wins, otherwise auto-detect a lone slim plugin.
  if (has(pluginClientName)) {
    return { kind: 'legacy' }
  }

  const slimPlugins = [pluginFetchName, pluginAxiosName].filter(has)
  if (slimPlugins.length === 1) {
    return { kind: 'slim', pluginName: slimPlugins[0]! }
  }
  if (slimPlugins.length > 1) {
    return {
      kind: 'error',
      message: `Both \`@kubb/plugin-fetch\` and \`@kubb/plugin-axios\` are registered. Set \`client: 'fetch' | 'axios'\` to choose which client the hooks call.`,
    }
  }

  return { kind: 'legacy' }
}
