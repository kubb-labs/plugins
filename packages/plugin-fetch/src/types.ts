import type { PluginType } from '@kubb/kit'
import type { ClientOptions as Options, ClientResolvedOptions as ResolvedOptions, ResolverClient } from '@kubb/plugin-client'

export type { ClientOptions as Options, ClientResolvedOptions as ResolvedOptions, ResolverClient } from '@kubb/plugin-client'

/**
 * The plugin factory type for `@kubb/plugin-fetch`. Shares the options surface, resolver, and
 * resolved-options shape with the other client plugins; only the plugin name and transport
 * differ.
 */
export type PluginFetch = PluginType<'plugin-fetch', Options, ResolvedOptions, ResolverClient>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-fetch': PluginFetch
    }
  }
}
