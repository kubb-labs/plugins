import { operationKey } from '@internals/shared'
import { camelCase, createResolver } from '@kubb/kit'
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
 * resolverMcp.name('addPet') // 'addPetHandler'
 * ```
 */
export const resolverMcp = createResolver<PluginMcp>({
  pluginName: 'plugin-mcp',
  name(name) {
    return this.memo(`name:${name}`, () => camelCase(name, { suffix: 'handler' }))
  },
  handler: {
    name(node) {
      const name = this.name(node.operationId)
      return this.resolveName({ key: operationKey(node, 'handler', 'name'), name })
    },
  },
})
