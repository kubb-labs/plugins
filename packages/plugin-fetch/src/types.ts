import type { PluginFactoryOptions } from '@kubb/core'
import type { Options, ResolvedOptions, ResolverClient } from '@internals/client'

export type { Options, ResolvedOptions, ResolverClient } from '@internals/client'

/**
 * The plugin factory type for `@kubb/plugin-fetch`. Shares the slim options surface, resolver, and
 * resolved-options shape with the other slim client plugins; only the plugin name and transport
 * differ.
 */
export type PluginFetch = PluginFactoryOptions<'plugin-fetch', Options, ResolvedOptions, ResolverClient>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-fetch': PluginFetch
    }
  }
}
