import type { Override, PluginFactoryOptions } from 'kubb/kit'
import type { Options as ClientOptions, ResolvedOptions as ClientResolvedOptions, ResolverClient } from '@internals/client'

export type { ResolverClient } from '@internals/client'

/**
 * Omits keys from every member of a union, where the built-in `Omit` would collapse the union into one shape.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/**
 * Options for `pluginClient`. It takes the shared client options, without the ones this plugin does not use,
 * plus the required `importPath`.
 *
 * @example
 * ```ts
 * pluginClient({ importPath: '../../../client' })
 * ```
 */
export type Options = DistributiveOmit<ClientOptions, 'sdk' | 'returnType' | 'baseURL' | 'override'> & {
  /**
   * Applies different options to operations that match a pattern.
   * `sdk`, `returnType`, and `baseURL` are not available, because this plugin generates standalone operations and your client module owns the base URL.
   */
  override?: Array<Override<Omit<ResolvedOptions, 'throwOnErrorDefault' | 'sdk' | 'returnType' | 'baseURL'>>>
  /**
   * Import specifier of your own client module, written into every generated import exactly as given.
   * It must resolve from the generated file, so use a relative path, a package name, or an alias.
   *
   * @example
   * ```ts
   * pluginClient({ importPath: '../../../client' }) // relative to src/gen/clients/<tag>/
   * pluginClient({ importPath: '@my-org/api-client' }) // a package
   * ```
   */
  importPath: string
}

/**
 * Options after `pluginClient` applies its defaults.
 */
export type ResolvedOptions = ClientResolvedOptions & { importPath: string }
/**
 * Plugin type of `@kubb/plugin-client`, registered in the Kubb plugin registry.
 */
export type PluginClient = PluginFactoryOptions<'plugin-client', Options, ResolvedOptions, ResolverClient>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-client': PluginClient
    }
  }
}
