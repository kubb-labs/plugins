import { camelCase, ensureValidVarName, toFilePath } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginSlimClient } from './types.ts'

/**
 * Default resolver shared by the slim client plugins. Functions and files use camelCase; URL helpers
 * get a `get<Operation>Url` name.
 *
 * @example
 * ```ts
 * resolverClient.resolveName('show pet by id') // 'showPetById'
 * resolverClient.resolveUrlName(operationNode) // 'getShowPetByIdUrl'
 * ```
 */
export const resolverClient = defineResolver<PluginSlimClient>(() => ({
  name: 'default',
  pluginName: 'plugin-slim-client',
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
  resolveUrlName(node) {
    const name = this.resolveName(node.operationId)
    return `get${name.charAt(0).toUpperCase()}${name.slice(1)}Url`
  },
}))
