import { camelCase, ensureValidVarName, pascalCase } from '@internals/utils'
import { defineResolver } from 'kubb/kit'
import type { PluginContractClient } from './types.ts'

/**
 * Default resolver shared by the client plugins. Functions and files inherit the built-in camelCase
 * `name` and `file`; classes and tag groups use PascalCase.
 *
 * @example
 * ```ts
 * resolverClient.name('show pet by id')  // 'showPetById'
 * resolverClient.groupName('pet')        // 'PetClient'
 * ```
 */
export const resolverClient = defineResolver<PluginContractClient>(() => ({
  pluginName: 'plugin-contract-client',
  className(name) {
    return ensureValidVarName(pascalCase(name))
  },
  groupName(name) {
    return ensureValidVarName(pascalCase(`${name} Client`))
  },
  propertyName(name) {
    return ensureValidVarName(camelCase(name))
  },
}))
