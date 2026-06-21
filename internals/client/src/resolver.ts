import { camelCase, ensureValidVarName, toFilePath } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginContractClient } from './types.ts'

/**
 * Default resolver shared by the client plugins. Functions and files use camelCase.
 *
 * @example
 * ```ts
 * resolverClient.resolveName('show pet by id') // 'showPetById'
 * ```
 */
export const resolverClient = defineResolver<PluginContractClient>(() => ({
  name: 'default',
  pluginName: 'plugin-contract-client',
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
}))
