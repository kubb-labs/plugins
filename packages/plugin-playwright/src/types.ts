import type { Output, PluginFactoryOptions } from 'kubb/kit'

/**
 * Registers a plugin with fixed output settings and no configurable options yet.
 */
export type PluginPlaywright = PluginFactoryOptions<'plugin-playwright', Record<string, never>, { output: Output }>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-playwright': PluginPlaywright
    }
  }
}
