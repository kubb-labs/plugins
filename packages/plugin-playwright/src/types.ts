import type { Output, PluginFactoryOptions } from 'kubb/kit'

/**
 * Options for the generated Playwright request helpers.
 */
export type Options = {
  /**
   * URL prefix for generated requests. A trailing slash is removed before joining the operation path.
   * When omitted, requests stay relative to the Playwright context's baseURL; OpenAPI servers are ignored.
   */
  baseURL?: string
}

/**
 * Registers the Playwright plugin with its resolved output and URL settings.
 */
export type PluginPlaywright = PluginFactoryOptions<'plugin-playwright', Options, { output: Output; baseURL: Options['baseURL'] }>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-playwright': PluginPlaywright
    }
  }
}
