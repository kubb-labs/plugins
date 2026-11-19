import { composeResolver, createHandlerResolver } from '@internals/shared'
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
export const resolverMcp = composeResolver<PluginMcp>('plugin-mcp', createHandlerResolver())
