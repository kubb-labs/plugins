import type { ast, Output, PluginFactoryOptions, Resolver, ResolverPatch } from 'kubb/kit'

/**
 * Naming and file resolution for Playwright helpers.
 */
export type ResolverPlaywright = Resolver

/**
 * Options for the generated Playwright request helpers.
 */
export type Options = {
  /**
   * URL prefix for generated requests. A trailing slash is removed before joining the operation path.
   * When omitted, requests stay relative to the Playwright context's baseURL; OpenAPI servers are ignored.
   */
  baseURL?: string
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
 * Registers the Playwright plugin with its resolved output, URL, and naming settings.
 */
export type PluginPlaywright = PluginFactoryOptions<
  'plugin-playwright',
  Options,
  { output: Output; baseURL: Options['baseURL']; resolver: ResolverPlaywright },
  ResolverPlaywright
>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-playwright': PluginPlaywright
    }
  }
}
