import { createHandlerResolver } from '@internals/shared'
import { Resolver } from '@kubb/kit'
import type { ResolverMcp } from '../types.ts'

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
export const resolverMcp = Resolver.merge<ResolverMcp>({ pluginName: 'plugin-mcp' }, createHandlerResolver())
