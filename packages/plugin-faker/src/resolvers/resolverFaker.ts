import { composeResolver, createCasedResolver, createOperationResolver } from '@internals/shared'
import type { PluginFaker } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-faker`. Decides the names and file
 * paths for every generated mock factory. Functions and files are prefixed
 * with `create` so `Pet` becomes `createPet`.
 *
 * @example Resolve a factory name
 * ```ts
 * import { resolverFaker } from '@kubb/plugin-faker'
 *
 * resolverFaker.name('list pets') // 'createListPets'
 * ```
 */
export const resolverFaker = composeResolver<PluginFaker>('plugin-faker', createCasedResolver('camel', { prefix: 'create' }), createOperationResolver())
