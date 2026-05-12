import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginMcp } from '../types.ts'

/**
 * Naming convention resolver for MCP plugin.
 *
 * Provides default naming helpers using camelCase with a `handler` suffix for functions.
 *
 * @example
 * `resolverMcp.default('addPet', 'function')  // → 'addPetHandler'`
 */
export const resolverMcp = defineResolver<PluginMcp>(() => ({
  name: 'default',
  pluginName: 'plugin-mcp',
  default(name, type) {
    if (type === 'file') {
      return camelCase(name, { isFile: true })
    }
    return camelCase(name, { suffix: 'handler' })
  },
  resolveName(name) {
    return this.default(name, 'function')
  },
  resolvePathName(name, type) {
    return this.default(name, type)
  },
  resolveHandlerName(node) {
    return this.resolveName(node.operationId)
  },
}))
