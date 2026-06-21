import { camelCase, ensureValidVarName, pascalCase, toFilePath } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginClient } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-client`. Decides the names and file
 * paths for every generated client function or class. Functions and files use
 * camelCase; classes and tag groups use PascalCase.
 *
 * @example Resolve client function and class names
 * ```ts
 * import { resolverClient } from '@kubb/plugin-client'
 *
 * resolverClient.default('list pets', 'function') // 'listPets'
 * resolverClient.resolveClassName('pet')          // 'Pet'
 * resolverClient.resolveGroupName('pet')          // 'PetClient'
 * ```
 */
export const resolverClient = defineResolver<PluginClient>(() => ({
  name: 'default',
  pluginName: 'plugin-client',
  default(name, type) {
    if (type === 'file') return toFilePath(name)
    return ensureValidVarName(camelCase(name))
  },
  resolveName(name) {
    return this.default(name, 'function')
  },
  resolvePathName(name, type) {
    return this.default(name, type)
  },
  resolveClassName(name) {
    return ensureValidVarName(pascalCase(name))
  },
  resolveGroupName(name) {
    return ensureValidVarName(pascalCase(`${name} Client`))
  },
  resolveClientPropertyName(name) {
    return ensureValidVarName(camelCase(name))
  },
}))
