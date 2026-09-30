import type { Override, PluginFactoryOptions } from 'kubb/kit'
import type { Options as ClientOptions, ResolvedOptions as ClientResolvedOptions, ResolverClient } from '@internals/client'

export type { ResolverClient } from '@internals/client'

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

export type Options = DistributiveOmit<ClientOptions, 'sdk' | 'returnType' | 'override'> & {
  /** Per-operation overrides. `sdk` is not available: this plugin generates standalone operations only. */
  override?: Array<Override<Omit<ResolvedOptions, 'throwOnErrorDefault' | 'sdk' | 'returnType'>>>
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
