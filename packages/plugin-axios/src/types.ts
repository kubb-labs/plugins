import type { PluginType } from '@kubb/kit'
import type { ClientOptions, ClientResolvedOptions, ResolverClient } from '@kubb/plugin-client'

export type { ClientResolvedOptions, ResolverClient } from '@kubb/plugin-client'

/** The shared client options, without `returnType: 'plain'`, which only fits a client module `@kubb/plugin-client` calls. */
export type PluginAxiosOptions = ClientOptions & { returnType?: 'full' | 'data' }

/**
 * The plugin factory type for `@kubb/plugin-axios`. Shares the options surface, resolver, and
 * resolved-options shape with the other client plugins; only the plugin name and transport
 * differ.
 */
export type PluginAxios = PluginType<'plugin-axios', PluginAxiosOptions, ClientResolvedOptions, ResolverClient>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-axios': PluginAxios
    }
  }
}

/** @deprecated Use `PluginAxiosOptions`. Removed in v6. */
export type Options = PluginAxiosOptions

/** @deprecated Use `ClientResolvedOptions`. Removed in v6. */
export type ResolvedOptions = ClientResolvedOptions
