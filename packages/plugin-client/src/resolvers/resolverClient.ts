import { camelCase, pascalCase } from '@internals/utils'
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
export const resolverClient = defineResolver<PluginClient>(() => ({
  name: 'default',
  pluginName: 'plugin-client',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return this.default(name, 'function')
  },
  resolvePathName(name, type) {
    return this.default(name, type)
  },
  resolveClassName(name) {
    return pascalCase(name)
  },
  resolveGroupName(name) {
    return pascalCase(name)
  },
  resolveClientPropertyName(name) {
    return camelCase(name)
  },
  resolveUrlName(node) {
    const name = this.resolveName(node.operationId)
    return `get${name.charAt(0).toUpperCase()}${name.slice(1)}Url`
  },
}))
