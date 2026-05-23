import { camelCase, ensureValidVarName, pascalCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginZod } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-zod`. Decides the names and file
 * paths for every generated Zod schema. Schemas use camelCase with a
 * `Schema` suffix (`listPetsSchema`); their inferred types use PascalCase.
 *
 * @example Resolve schema and type names
 * ```ts
 * import { resolverZod } from '@kubb/plugin-zod'
 *
 * resolverZod.default('list pets', 'function') // 'listPetsSchema'
 * resolverZod.resolveSchemaTypeName('pet')     // 'PetSchema'
 * ```
 */
export const resolverZod = defineResolver<PluginZod>(() => {
  return {
    name: 'default',
    pluginName: 'plugin-zod',
    default(name, type) {
      const resolved = camelCase(name, { isFile: type === 'file', suffix: type ? 'schema' : undefined })
      return type === 'file' ? resolved : ensureValidVarName(resolved)
    },
    resolveSchemaName(name) {
      return ensureValidVarName(camelCase(name, { suffix: 'schema' }))
    },
    resolveSchemaTypeName(name) {
      return ensureValidVarName(pascalCase(name, { suffix: 'schema' }))
    },
    resolveTypeName(name) {
      return ensureValidVarName(pascalCase(name))
    },
    resolvePathName(name, type) {
      return this.default(name, type)
    },
    resolveParamName(node, param) {
      return this.resolveSchemaName(`${node.operationId} ${param.in} ${param.name}`)
    },
    resolveResponseStatusName(node, statusCode) {
      return this.resolveSchemaName(`${node.operationId} Status ${statusCode}`)
    },
    resolveDataName(node) {
      return this.resolveSchemaName(`${node.operationId} Data`)
    },
    resolveResponsesName(node) {
      return this.resolveSchemaName(`${node.operationId} Responses`)
    },
    resolveResponseName(node) {
      return this.resolveSchemaName(`${node.operationId} Response`)
    },
    resolvePathParamsName(node, param) {
      return this.resolveParamName(node, param)
    },
    resolveQueryParamsName(node, param) {
      return this.resolveParamName(node, param)
    },
    resolveHeaderParamsName(node, param) {
      return this.resolveParamName(node, param)
    },
  }
})
