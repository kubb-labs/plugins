import type { Override, PluginFactoryOptions } from 'kubb/kit'
import type { Options as ClientOptions, ResolvedOptions as ClientResolvedOptions, ResolverClient } from '@internals/client'

export type { ResolverClient } from '@internals/client'

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

export type Options = DistributiveOmit<ClientOptions, 'sdk' | 'returnType' | 'baseURL' | 'override'> & {
  /** Per-operation overrides. `sdk`, `returnType`, and `baseURL` are not available. Standalone operations only, and your client module owns the base URL. */
  override?: Array<Override<Omit<ResolvedOptions, 'throwOnErrorDefault' | 'sdk' | 'returnType' | 'baseURL'>>>
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
