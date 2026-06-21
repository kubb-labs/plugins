/**
 * Resolves which client a query plugin (react-query, vue-query, swr) should call for an operation,
 * shared by all three so the selection rules and diagnostics stay in one place.
 *
 * Every client plugin now speaks the `RequestResult` contract, so the resolver picks between three
 * generation strategies:
 *
 * - `contract` — a registered contract client plugin (plugin-fetch, plugin-axios, or plugin-client)
 *   owns the `<op>` functions and the hooks import and call them.
 * - `contract-inline` — no client plugin is registered, so the query plugin emits its own inline
 *   contract client and injects the matching contract runtime.
 *
 * The `client` string selects explicitly (`'fetch'` / `'axios'`); when it is unset a lone registered
 * contract client plugin is picked up automatically, otherwise the plugin falls back to
 * `contract-inline`.
 */

// Canonical plugin names. They mirror the `pluginFetchName` / `pluginAxiosName` / `pluginClientName`
// consts the plugins export, kept as literals so this internal needs no plugin install deps.
const pluginFetchName = 'plugin-fetch'
const pluginAxiosName = 'plugin-axios'
const pluginClientName = 'plugin-client'

/**
 * The client selector accepted by a query plugin's `client` option. Both call a registered contract
 * client plugin.
 */
export type ClientSelector = 'fetch' | 'axios'

/**
 * The outcome of {@link resolveClient}.
 *
 * - `contract` names the contract client plugin whose `<op>` functions the hooks import.
 * - `contract-inline` tells the query plugin to emit its own inline contract client.
 * - `error` carries a setup diagnostic.
 */
export type ResolveClientResult = { kind: 'contract'; pluginName: string } | { kind: 'contract-inline' } | { kind: 'error'; message: string }

const selectorToPlugin: Record<'fetch' | 'axios', string> = {
  fetch: pluginFetchName,
  axios: pluginAxiosName,
}

// Every contract client plugin, in auto-detect priority order.
const contractPlugins = [pluginFetchName, pluginAxiosName, pluginClientName] as const

/**
 * Applies the `client` resolution rules. See the module comment for the strategy shape.
 *
 * @example
 * ```ts
 * resolveClient({ client: 'fetch', pluginNames: ['plugin-ts', 'plugin-fetch'] })
 * // { kind: 'contract', pluginName: 'plugin-fetch' }
 * ```
 *
 * @example
 * ```ts
 * resolveClient({ client: undefined, pluginNames: ['plugin-ts'] })
 * // { kind: 'contract-inline' }
 * ```
 */
export function resolveClient(options: { client: ClientSelector | undefined; pluginNames: ReadonlyArray<string> }): ResolveClientResult {
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
    return { kind: 'contract', pluginName }
  }

  // `client` unset: auto-detect a lone registered contract client plugin, otherwise emit an inline
  // contract client.
  const registered = contractPlugins.filter(has)
  if (registered.length === 1) {
    return { kind: 'contract', pluginName: registered[0]! }
  }
  if (registered.length > 1) {
    return {
      kind: 'error',
      message: `Multiple client plugins are registered (${registered.map((name) => `\`@kubb/${name}\``).join(', ')}). Set \`client: 'fetch' | 'axios'\` to choose which client the hooks call, or register a single client plugin.`,
    }
  }

  return { kind: 'contract-inline' }
}
