import type { ast, ResolverOverride, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver } from 'kubb/kit'

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
export type Options = OutputOptions & {
  /**
   * Base URL prepended to every request URL. When omitted, falls back to the
   * adapter's server URL (typically `servers[0].url`).
   */
  baseURL?: string
  /**
   * Skip operations matching at least one entry in the list.
   */
  exclude?: Array<Exclude>
  /**
   * Restrict generation to operations matching at least one entry in the list.
   */
  include?: Array<Include>
  /**
   * Apply a different options object to operations matching a pattern.
   */
  override?: Array<Override<ResolvedOptions>>
  /**
   * Override how helper names and file paths are built.
   */
  resolver?: ResolverOverride<ResolverCypress> & ThisType<ResolverCypress>
  /**
   * Macros applied to each operation node before printing.
   */
  macros?: Array<ast.Macro>
}

export type ResolvedOptions = {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<ResolvedOptions>>
  group: Group | null
  baseURL: Options['baseURL'] | undefined
  resolver: ResolverCypress
}

export type PluginCypress = PluginFactoryOptions<'plugin-cypress', Options, ResolvedOptions, ResolverCypress>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-cypress': PluginCypress
    }
  }
}
