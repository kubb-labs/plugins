import { ensureValidVarName } from '@internals/utils'
import { casing, createResolver, resolverCasedFile, resolverOperationParams, resolverOperationResponse } from '@kubb/kit'
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
export const resolverFaker = createResolver<PluginFaker>({
  pluginName: 'plugin-faker',
  name(name) {
    return this.memo(`name:${name}`, () => ensureValidVarName(casing.camel(name, { prefix: 'create' })))
  },
  ...resolverCasedFile((part) => casing.camel(part, { prefix: 'create' })),
  ...resolverOperationParams,
  ...resolverOperationResponse,
})
