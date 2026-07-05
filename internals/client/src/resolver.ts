import { camelCase, ensureValidVarName, pascalCase, toFilePath } from '@internals/utils'
import { defineResolver } from 'kubb/kit'
import type { PluginContractClient } from './types.ts'

/**
 * Default resolver shared by the client plugins. Functions and files use camelCase; classes and
 * tag groups use PascalCase.
 *
 * @example
 * ```ts
 * resolverClient.resolveName('show pet by id') // 'showPetById'
 * resolverClient.resolveGroupName('pet')       // 'PetClient'
 * ```
 */
export const resolverClient = defineResolver<PluginContractClient>(() => ({
  name: 'default',
  pluginName: 'plugin-contract-client',
  core: {
    name(name) {
      return ensureValidVarName(camelCase(name))
    },
    fileName(name) {
      return toFilePath(name)
    },
  },
  resolveName(name) {
    return this.core.name(name)
  },
  resolveClassName(name) {
    return ensureValidVarName(pascalCase(name))
  },
  resolveGroupName(name) {
    return ensureValidVarName(pascalCase(`${name} Client`))
  },
  resolveClientPropertyName(name) {
    return ensureValidVarName(camelCase(name))
  },
}))
