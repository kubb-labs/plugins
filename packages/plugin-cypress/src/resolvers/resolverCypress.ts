import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginCypress } from '../types.ts'

/**
 * Naming convention resolver for Cypress plugin.
 *
 * Provides default naming helpers using camelCase for functions and file paths.
 *
 * @example
 * `resolverCypress.default('list pets', 'function')  // → 'listPets'`
 */
export const resolverCypress = defineResolver<PluginCypress>((ctx) => ({
  name: 'default',
  pluginName: 'plugin-cypress',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return ctx.default(name, 'function')
  },
}))
