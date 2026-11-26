import type { PluginType } from '@kubb/kit'
import type { ClientOptions, ClientResolvedOptions, ResolverClient } from '@kubb/plugin-client'

export type { ClientResolvedOptions, ResolverClient } from '@kubb/plugin-client'

/** The shared client options, without `returnType: 'plain'`, which only fits a client module `@kubb/plugin-client` calls. */
export type PluginFetchOptions = ClientOptions & { returnType?: 'full' | 'data' }

/**
 * The plugin factory type for `@kubb/plugin-fetch`. Shares the options surface, resolver, and
 * resolved-options shape with the other client plugins; only the plugin name and transport
 * differ.
 */
export type PluginFetch = PluginType<'plugin-fetch', PluginFetchOptions, ClientResolvedOptions, ResolverClient>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-fetch': PluginFetch
    }
  }
}

/** @deprecated Use `PluginFetchOptions`. Removed in v6. */
export type Options = PluginFetchOptions

/** @deprecated Use `ClientResolvedOptions`. Removed in v6. */
export type ResolvedOptions = ClientResolvedOptions
