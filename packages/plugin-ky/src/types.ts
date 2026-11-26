import type { PluginType } from '@kubb/kit'
import type { ClientOptions, ClientResolvedOptions, ResolverClient } from '@kubb/plugin-client'

export type { ClientResolvedOptions, ResolverClient } from '@kubb/plugin-client'

/** The shared client options, without `returnType: 'plain'`, which only fits a client module `@kubb/plugin-client` calls. */
export type PluginKyOptions = ClientOptions & { returnType?: 'full' | 'data' }

/**
 * The plugin factory type for `@kubb/plugin-ky`. Shares the options surface, resolver, and
 * resolved-options shape with the other client plugins; only the plugin name and transport
 * differ.
 */
export type PluginKy = PluginType<'plugin-ky', PluginKyOptions, ClientResolvedOptions, ResolverClient>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-ky': PluginKy
    }
  }
}

/** @deprecated Use `PluginKyOptions`. Removed in v6. */
export type Options = PluginKyOptions

/** @deprecated Use `ClientResolvedOptions`. Removed in v6. */
export type ResolvedOptions = ClientResolvedOptions
