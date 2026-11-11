import type { PluginType } from '@kubb/kit'
import type { ClientOptions, ClientResolvedOptions as ResolvedOptions, ResolverClient } from '@kubb/plugin-client'

export type { ClientResolvedOptions as ResolvedOptions, ResolverClient } from '@kubb/plugin-client'

/**
 * Options for `pluginFetch`: the shared client options plus `importPath`.
 */
export type Options = ClientOptions & {
  /**
   * Module the generated operations import `client` and its types from, written into every import exactly as given.
   * It must resolve from the generated file, so use a relative path, a package name, or an alias.
   * The runtime is still copied into `.kubb/`, so the module can re-export it and replace `client`.
   * When `validator` validates header params, the module also exports `toHeadersStandardSchema` from `.kubb/standardSchema.ts`.
   * Unset, the operations import the bundled `.kubb/client.ts`. The class-based `sdk` always imports `.kubb/client.ts`.
   *
   * @example
   * ```ts
   * pluginFetch({ importPath: '../client' }) // relative to src/gen/clients/
   * // src/gen/client.ts
   * // export * from './.kubb/client'
   * // export { client } from '../api/client'
   * ```
   */
  importPath?: string
}

/**
 * The plugin factory type for `@kubb/plugin-fetch`. Shares the resolver and resolved-options shape
 * with the other client plugins; only the plugin name, the transport, and `importPath` differ.
 */
export type PluginFetch = PluginType<'plugin-fetch', Options, ResolvedOptions, ResolverClient>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-fetch': PluginFetch
    }
  }
}
