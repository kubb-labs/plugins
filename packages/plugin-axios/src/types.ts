import type { PluginType } from '@kubb/kit'
import type { ClientOptions, ClientResolvedOptions as ResolvedOptions, ResolverClient } from '@kubb/plugin-client'

export type { ClientResolvedOptions as ResolvedOptions, ResolverClient } from '@kubb/plugin-client'

/** The shared client options, without `returnType: 'plain'`, which only fits a client module `@kubb/plugin-client` calls. */
export type Options = ClientOptions & { returnType?: 'full' | 'data' }

/**
 * The plugin factory type for `@kubb/plugin-axios`. Shares the options surface, resolver, and
 * resolved-options shape with the other client plugins; only the plugin name and transport
 * differ.
 */
export type PluginAxios = PluginType<'plugin-axios', Options, ResolvedOptions, ResolverClient>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-axios': PluginAxios
    }
  }
}
