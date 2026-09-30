import type { PluginFactoryOptions } from 'kubb/kit'
import type { Options as ClientOptions, ResolvedOptions as ClientResolvedOptions, ResolverClient } from '@internals/client'

export type { ResolverClient } from '@internals/client'

export type Options = ClientOptions & {
  /** Import specifier for your own client module. The module supplies the helpers imported by generated operations. */
  importPath: string
}

export type ResolvedOptions = ClientResolvedOptions & { importPath: string }
export type PluginClient = PluginFactoryOptions<'plugin-client', Options, ResolvedOptions, ResolverClient>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-client': PluginClient
    }
  }
}
