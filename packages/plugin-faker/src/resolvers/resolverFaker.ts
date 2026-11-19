import { createCasedResolver, createOperationResolver } from '@internals/shared'
import { Resolver } from '@kubb/kit'
import type { ResolverFaker } from '../types.ts'

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
export const resolverFaker = Resolver.merge<ResolverFaker>(
  { pluginName: 'plugin-faker' },
  createCasedResolver('camel', { prefix: 'create' }),
  createOperationResolver(),
)
