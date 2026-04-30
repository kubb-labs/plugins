import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginClient } from '../types.ts'

/**
 * Naming convention resolver for client plugin.
 *
 * Provides default naming helpers using camelCase for functions and file paths.
 *
 * @example
 * `resolverClient.default('list pets', 'function')  // → 'listPets'`
 */
export const resolverClient = defineResolver<PluginClient>((ctx) => ({
  name: 'default',
  pluginName: 'plugin-client',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return ctx.default(name, 'function')
  },
}))
