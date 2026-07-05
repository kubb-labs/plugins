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
 * resolverMcp.core.name('addPet') // 'addPetHandler'
 * ```
 */
export const resolverMcp = defineResolver<PluginMcp>(() => ({
  name: 'default',
  pluginName: 'plugin-mcp',
  core: {
    name(name) {
      return camelCase(name, { suffix: 'handler' })
    },
    fileName(name) {
      return toFilePath(name)
    },
  },
  resolveName(name) {
    return this.core.name(name)
  },
  resolveHandlerName(node) {
    return this.resolveName(node.operationId)
  },
}))
