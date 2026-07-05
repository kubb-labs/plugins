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
 * resolverCypress.name('list pets') // 'listPets'
 * ```
 */
export const resolverCypress = defineResolver<PluginCypress>(() => ({
  pluginName: 'plugin-cypress',
}))
