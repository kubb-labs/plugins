import { camelCase, toFilePath } from '@internals/utils'
import { defineResolver } from 'kubb/kit'
import type { PluginCypress } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-cypress`. Decides the names and file
 * paths for every generated `cy.request()` wrapper. Functions and files use
 * camelCase, matching the convention from `@kubb/plugin-axios` and `@kubb/plugin-fetch`.
 *
 * @example Resolve a helper name
 * ```ts
 * import { resolverCypress } from '@kubb/plugin-cypress'
 *
 * resolverCypress.core.name('list pets') // 'listPets'
 * ```
 */
export const resolverCypress = defineResolver<PluginCypress>(() => ({
  name: 'default',
  pluginName: 'plugin-cypress',
  core: {
    name(name) {
      return camelCase(name)
    },
    fileName(name) {
      return toFilePath(name)
    },
  },
  resolveName(name) {
    return this.core.name(name)
  },
}))
