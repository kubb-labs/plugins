import type { PluginType } from '@kubb/kit'
import type { ClientOptions, ClientResolvedOptions as ResolvedOptions, ResolverClient } from '@kubb/plugin-client'

export type { ClientResolvedOptions as ResolvedOptions, ResolverClient } from '@kubb/plugin-client'

/**
 * The shared client options. `returnType: 'plain'` is left out: it is the shape `@kubb/plugin-client`
 * emits for a client module you own, and it does not typecheck against the bundled runtime.
 */
export type Options = ClientOptions & { returnType?: 'full' | 'data' }

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
