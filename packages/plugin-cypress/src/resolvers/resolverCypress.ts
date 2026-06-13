import { camelCase, toFilePath } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginCypress } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-cypress`. Decides the names and file
 * paths for every generated `cy.request()` wrapper. Functions and files use
 * camelCase, matching the convention from `@kubb/plugin-client`.
 *
 * @example Resolve a helper name
 * ```ts
 * import { resolverCypress } from '@kubb/plugin-cypress'
 *
 * resolverCypress.default('list pets', 'function') // 'listPets'
 * ```
 */
export const resolverCypress = defineResolver<PluginCypress>(() => ({
  name: 'default',
  pluginName: 'plugin-cypress',
  default(name, type) {
    return type === 'file' ? toFilePath(name) : camelCase(name)
  },
  resolveName(name) {
    return this.default(name, 'function')
  },
  resolvePathName(name, type) {
    return this.default(name, type)
  },
}))
