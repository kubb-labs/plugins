import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginReactQuery } from '../types.ts'

/**
 * Naming convention resolver for React Query plugin.
 *
 * Provides default naming helpers using camelCase for functions and file paths.
 *
 * @example
 * `resolverReactQuery.default('list pets', 'function')  // → 'listPets'`
 */
export const resolverReactQuery = defineResolver<PluginReactQuery>((ctx) => ({
  name: 'default',
  pluginName: 'plugin-react-query',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return ctx.default(name, 'function')
  },
}))
