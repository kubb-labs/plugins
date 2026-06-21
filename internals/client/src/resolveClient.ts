/**
 * Resolves which client plugin a consumer (react-query, vue-query, swr, mcp) should call for an
 * operation, shared so the selection rules and diagnostics stay in one place.
 *
 * Every client runtime lives in a dedicated client plugin, so a consumer always calls a registered
 * contract client plugin (plugin-fetch or plugin-axios) and never emits its own inline client:
 *
 * - `contract` — a registered contract client plugin owns the `<op>` functions and the consumer
 *   imports and calls them.
 * - `error` — no client plugin is registered, several are registered without a selector, or the
 *   requested one is missing.
 *
 * The `client` string selects explicitly (`'fetch'` / `'axios'`); when it is unset a lone registered
 * contract client plugin is picked up automatically.
 */

// Canonical plugin names. They mirror the `pluginFetchName` / `pluginAxiosName` consts the plugins
// export, kept as literals so this internal needs no plugin install deps.
const pluginFetchName = 'plugin-fetch'
const pluginAxiosName = 'plugin-axios'

/**
 * The client selector accepted by a consumer's `client` option. Both call a registered contract
 * client plugin.
 */
export type ClientSelector = 'fetch' | 'axios'

/**
 * The outcome of {@link resolveClient}.
 *
 * - `contract` names the contract client plugin whose `<op>` functions the consumer imports.
 * - `error` carries a setup diagnostic.
 */
export type ResolveClientResult = { kind: 'contract'; pluginName: string } | { kind: 'error'; message: string }

const selectorToPlugin: Record<'fetch' | 'axios', string> = {
  fetch: pluginFetchName,
  axios: pluginAxiosName,
}

// Every contract client plugin, in auto-detect priority order.
const contractPlugins = [pluginFetchName, pluginAxiosName] as const

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
 * // { kind: 'error', message: 'No client plugin is registered…' }
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

  // `client` unset: auto-detect a lone registered contract client plugin.
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

  return {
    kind: 'error',
    message: 'No client plugin is registered. Add `@kubb/plugin-axios` or `@kubb/plugin-fetch` to `plugins` so the generated code has an HTTP client to call.',
  }
}
