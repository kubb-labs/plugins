import { createCasedFile, createOperationParamResolver, createOperationResponseResolver } from '@internals/shared'
import { camelCase, ensureValidVarName } from '@internals/utils'
import { createResolver } from 'kubb/kit'
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
    return ensureValidVarName(camelCase(name, { prefix: 'create' }))
  },
  file: createCasedFile((part) => camelCase(part, { prefix: 'create' })),
  param: createOperationParamResolver(),
  response: createOperationResponseResolver(),
})
