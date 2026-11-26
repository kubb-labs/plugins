import type { ast } from '@internals/ast'
import type { PluginOptions, ResolvedPluginOptions } from '@internals/shared/types'
import type { PluginType, Resolver, ResolverInput } from '@kubb/kit'

/**
 * Resolver for Cypress that provides naming methods for test functions.
 */
export type ResolverCypress = Resolver

/**
 * Where the generated Cypress helpers are written and how they are exported, plus the optional
 * `group` strategy. The `group` option organizes `output.mode: 'directory'` output into per-tag or per-path subdirectories.
 *
 * @default { path: 'cypress', barrel: { type: 'named' } }
 */
export type PluginCypressOptions = PluginOptions<PluginCypressResolvedOptions> & {
  /**
   * Base URL prepended to every request URL. When omitted, requests use the operation path
   * only, so Cypress resolves it against its own `baseUrl`. The adapter's server URL is not used.
   */
  baseURL?: string
  /**
   * Override how helper names and file paths are built.
   */
  resolver?: ResolverInput<ResolverCypress>
  /**
   * Macros applied to each operation node before printing.
   */
  macros?: Array<ast.Macro>
}

export type PluginCypressResolvedOptions = ResolvedPluginOptions<PluginCypressResolvedOptions> & {
  baseURL: PluginCypressOptions['baseURL'] | undefined
}

export type PluginCypress = PluginType<'plugin-cypress', PluginCypressOptions, PluginCypressResolvedOptions, ResolverCypress>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-cypress': PluginCypress
    }
  }
}
