import { resolveOperationName } from '@internals/shared'
import { ensureValidVarName } from '@internals/utils'
import { createResolver } from 'kubb/kit'
import type { PluginContractClient } from './types.ts'

/**
 * Default resolver shared by the client plugins. Functions use safe camelCase identifiers and
 * files inherit the built-in casing; classes and tag groups use PascalCase.
 *
 * @example
 * ```ts
 * resolverClient.name('show pet by id')  // 'showPetById'
 * resolverClient.groupName('pet')        // 'PetClient'
 * ```
 */
export const resolverClient = createResolver<PluginContractClient>({
  pluginName: 'plugin-contract-client',
  name: resolveOperationName,
  className(name) {
    return ensureValidVarName(this.pascalCase(name))
  },
  groupName(name) {
    return ensureValidVarName(this.pascalCase(`${name} Client`))
  },
  propertyName(name) {
    return ensureValidVarName(this.camelCase(name))
  },
})
