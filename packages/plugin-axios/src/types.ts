import type { PluginType } from '@kubb/kit'
import type { ClientOptions as Options, ClientResolvedOptions as ResolvedOptions, ResolverClient } from '@kubb/plugin-client'

export type { ClientOptions as Options, ClientResolvedOptions as ResolvedOptions, ResolverClient } from '@kubb/plugin-client'

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
