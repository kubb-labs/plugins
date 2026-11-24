import { casing, createResolver, operationKey } from '@kubb/kit'
import type { PluginMcp } from '../types.ts'

const toolNameLimit = 64

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
    return this.memo(`name:${name}`, () => casing.camel(name, { suffix: 'handler' }))
  },
  handler: {
    name(node) {
      const name = this.name(node.operationId)
      return this.resolveName({ key: operationKey(node, 'handler', 'name'), name })
    },
  },
  tool: {
    name(node) {
      return this.memo(`plugin-mcp:toolName:${operationKey(node).join(':')}`, () => {
        const used = this.memo('plugin-mcp:toolNames', () => new Set<string>())
        const base = node.operationId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, toolNameLimit)
        let name = base
        let count = 1
        while (used.has(name)) {
          count += 1
          const suffix = `_${count}`
          name = `${base.slice(0, toolNameLimit - suffix.length)}${suffix}`
        }
        used.add(name)

        return name
      })
    },
  },
})
