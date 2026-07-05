import { camelCase, toFilePath } from '@internals/utils'
import { defineResolver } from 'kubb/kit'
import type { PluginMcp } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-mcp`. Decides the names and file
 * paths for every generated MCP tool handler. Function names get a `Handler`
 * suffix so an operation `addPet` becomes `addPetHandler`.
 *
 * @example Resolve a handler name
 * ```ts
 * import { resolverMcp } from '@kubb/plugin-mcp'
 *
 * resolverMcp.default('addPet', 'function') // 'addPetHandler'
 * ```
 */
export const resolverMcp = defineResolver<PluginMcp>(() => ({
  name: 'default',
  pluginName: 'plugin-mcp',
  default(name, type) {
    if (type === 'file') {
      return toFilePath(name)
    }
    return camelCase(name, { suffix: 'handler' })
  },
  resolveName(name) {
    return this.default(name, 'function')
  },
  resolveHandlerName(node) {
    return this.resolveName(node.operationId)
  },
}))
