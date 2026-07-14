import { createCasedFile } from '@internals/shared'
import { camelCase, ensureValidVarName, pascalCase } from '@internals/utils'
import { createResolver } from 'kubb/kit'
import type { PluginEffectHttpApiClient } from '../types.ts'

/**
 * Default resolver for Effect HttpApi endpoint, group, API, and client names.
 */
export const resolverEffectHttpApiClient = createResolver<PluginEffectHttpApiClient>({
  pluginName: 'plugin-effect-httpapiclient',
  name(name) {
    return ensureValidVarName(camelCase(name))
  },
  file: createCasedFile(camelCase),
  endpoint: {
    name(node) {
      return ensureValidVarName(camelCase(node.operationId, { suffix: 'endpoint' }))
    },
    identifier(node) {
      return ensureValidVarName(camelCase(node.operationId))
    },
  },
  group: {
    name(tag) {
      return ensureValidVarName(pascalCase(tag, { suffix: 'group' }))
    },
    identifier(tag) {
      return ensureValidVarName(camelCase(tag))
    },
  },
  api: {
    name() {
      return 'Api'
    },
  },
  client: {
    name() {
      return 'ApiClient'
    },
  },
})
