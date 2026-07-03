import type { PluginFactoryOptions } from 'kubb/kit'
import type { Options, ResolvedOptions, ResolverClient } from '@internals/client'

export type { Options, ResolvedOptions, ResolverClient } from '@internals/client'

/**
 * The plugin factory type for `@kubb/plugin-axios`. Shares the options surface, resolver, and
 * resolved-options shape with the other client plugins; only the plugin name and transport
 * differ.
 */
export type PluginAxios = PluginFactoryOptions<'plugin-axios', Options, ResolvedOptions, ResolverClient>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-axios': PluginAxios
    }
  }
}
