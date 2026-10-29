/**
 * Resolves which client plugin a consumer (react-query, vue-query, swr, mcp) should call for an
 * operation, shared so the selection rules and diagnostics stay in one place.
 *
 * Every client runtime lives in a dedicated client plugin, so a consumer always calls a registered
 * contract client plugin (plugin-fetch, plugin-axios, or plugin-client) and never emits its own
 * inline client:
 *
 * - `contract` — a registered contract client plugin owns the `<op>` functions and the consumer
 *   imports and calls them.
 * - `error` — no client plugin is registered, several are registered without a selector, the
 *   requested one is missing, or `client` is not a known selector.
 *
 * The `client` string selects explicitly (`'fetch'` / `'axios'` / `'client'`); when it is unset a
 * lone registered contract client plugin is picked up automatically.
 */

import { Diagnostics } from '@kubb/kit'

// Canonical plugin names. They mirror the `pluginFetchName` / `pluginAxiosName` / `pluginClientName`
// consts the plugins export, kept as literals so this internal needs no plugin install deps.
const pluginFetchName = 'plugin-fetch'
const pluginAxiosName = 'plugin-axios'
const pluginClientName = 'plugin-client'

/**
 * The client selector accepted by a consumer's `client` option. Each calls a registered contract
 * client plugin.
 */
export type ClientSelector = 'fetch' | 'axios' | 'client'

/**
 * The resolved client strategy stored in a consumer plugin's options: the generated code always
 * imports and calls a registered contract client plugin's `<op>`. The client runtime lives in
 * plugin-axios / plugin-fetch, so nothing is bundled by the consumer.
 */
export type ResolvedContractClient = { kind: 'contract'; pluginName: string }

/**
 * The outcome of {@link resolveClient}.
 *
 * - `contract` names the contract client plugin whose `<op>` functions the consumer imports.
 * - `error` carries a setup diagnostic: its code, what is wrong, and how to fix it.
 */
export type ResolveClientResult =
  | ResolvedContractClient
  | { kind: 'error'; code: typeof Diagnostics.code.missingDependency | typeof Diagnostics.code.invalidPluginOptions; message: string; help: string }

const selectorToPlugin: Record<ClientSelector, string> = {
  fetch: pluginFetchName,
  axios: pluginAxiosName,
  client: pluginClientName,
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
 * // { kind: 'error', code: 'KUBB_MISSING_DEPENDENCY', message: 'No client plugin is registered.', help: 'Add …' }
 * ```
 */
export function resolveClient(options: { client: ClientSelector | undefined; pluginNames: ReadonlyArray<string> }): ResolveClientResult {
  const { client, pluginNames } = options
  const has = (name: string) => pluginNames.includes(name)

  if (client === 'fetch' || client === 'axios' || client === 'client') {
    const pluginName = selectorToPlugin[client]
    if (!has(pluginName)) {
      return {
        kind: 'error',
        code: Diagnostics.code.missingDependency,
        message: `\`client: '${client}'\` is set but \`@kubb/plugin-${client}\` is not registered in \`plugins\`.`,
        help: `Add \`@kubb/plugin-${client}\` to \`plugins\`, or drop \`client\` to use a different client plugin.`,
      }
    }
    return { kind: 'contract', pluginName }
  }

  // A JS config bypasses the `ClientSelector` type, so reject unknown selectors instead of auto-detecting.
  if (client !== undefined) {
    return {
      kind: 'error',
      code: Diagnostics.code.invalidPluginOptions,
      message: `Option \`client\` is ${typeof client === 'string' ? `'${client}'` : String(client)}, but it must be one of 'fetch', 'axios', 'client'.`,
      help: 'Set `client` to one of those values, or drop it to use the registered client plugin.',
    }
  }

  // `client` unset: auto-detect a lone registered contract client plugin.
  const registered = contractPlugins.filter(has)
  if (registered.length === 1) {
    return { kind: 'contract', pluginName: registered[0]! }
  }
  if (registered.length > 1) {
    return {
      kind: 'error',
      code: Diagnostics.code.invalidPluginOptions,
      message: `Multiple client plugins are registered (${registered.map((name) => `\`@kubb/${name}\``).join(', ')}) and \`client\` is not set.`,
      help: "Set `client: 'fetch' | 'axios' | 'client'` to choose which client the hooks call, or register a single client plugin.",
    }
  }

  return {
    kind: 'error',
    code: Diagnostics.code.missingDependency,
    message: 'No client plugin is registered.',
    help: 'Add `@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client` to `plugins` so the generated code has an HTTP client to call.',
  }
}

/**
 * Resolves the contract client during a consumer plugin's setup hook.
 * It extracts the plugin names from the raw `plugins` config and applies {@link resolveClient}.
 * On a misconfiguration it throws a config diagnostic tagged with `plugin`, so every consumer
 * fails fast with the same message.
 */
export function resolveContractClient(options: {
  plugin: string
  client: ClientSelector | undefined
  plugins?: ReadonlyArray<unknown>
}): ResolvedContractClient {
  const { plugin, client, plugins = [] } = options
  const pluginNames = plugins.map((plugin) => (plugin as { name?: string }).name).filter((name): name is string => Boolean(name))
  const resolved = resolveClient({ client, pluginNames })
  if (resolved.kind === 'error') {
    const { code, message, help } = resolved
    throw new Diagnostics.Error({ code, severity: 'error', message, help, location: { kind: 'config' }, plugin })
  }
  return resolved
}
