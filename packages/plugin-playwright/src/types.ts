import type { ast, Exclude, Group, Include, Output, OutputOptions, Override, PluginFactoryOptions, Resolver, ResolverPatch } from 'kubb/kit'

/**
 * Naming and file resolution for Playwright helpers.
 */
export type ResolverPlaywright = Resolver

/**
 * Options for the generated Playwright request helpers.
 *
 * @default { output: { path: 'playwright', barrel: { type: 'named' } } }
 */
export type Options = OutputOptions & {
  /**
   * URL prefix for generated requests. A trailing slash is removed before joining the operation path.
   * When omitted, requests stay relative to the Playwright context's baseURL; OpenAPI servers are ignored.
   */
  baseURL?: string
  /**
   * Skips operations matching at least one filter, including operations selected by include.
   */
  exclude?: Array<Exclude>
  /**
   * Generates only operations matching at least one filter.
   */
  include?: Array<Include>
  /**
   * Applies the first matching rule's options to an operation.
   * Specify output.mode when overriding output; Kubb replaces the output object without inferring its mode again.
   */
  override?: Array<Override<ResolvedOptions>>
  /**
   * Overrides helper names and file paths. Unspecified methods keep the default pw naming.
   */
  resolver?: ResolverPatch<ResolverPlaywright>
  /**
   * Transforms operation nodes before generation, in the supplied order.
   */
  macros?: Array<ast.Macro>
}

/**
 * Options passed to generators after applying defaults and normalizing grouping.
 */
export type ResolvedOptions = {
  output: Output
  group: Group | null
  exclude: Array<Exclude>
  include: Options['include']
  override: Array<Override<ResolvedOptions>>
  baseURL: Options['baseURL']
  resolver: ResolverPlaywright
}

/**
 * Registers the Playwright plugin with its resolved generation options.
 */
export type PluginPlaywright = PluginFactoryOptions<'plugin-playwright', Options, ResolvedOptions, ResolverPlaywright>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-playwright': PluginPlaywright
    }
  }
}
