import { camelCase, ensureValidVarName, pascalCase, toFilePath } from '@internals/utils'
import { defineResolver } from 'kubb/kit'
import type { PluginZod } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-zod`. Decides the names and file
 * paths for every generated Zod schema. Schemas use camelCase with a
 * `Schema` suffix (`listPetsSchema`); their inferred types use PascalCase
 * with a `SchemaType` suffix (`PetSchemaType`), so the value and the type
 * never share an identifier even when the schema name is all-uppercase.
 *
 * @example Resolve schema and type names
 * ```ts
 * import { resolverZod } from '@kubb/plugin-zod'
 *
 * resolverZod.default('list pets', 'function') // 'listPetsSchema'
 * resolverZod.resolveSchemaTypeName('pet')     // 'PetSchemaType'
 * ```
 */
export const resolverZod = defineResolver<PluginZod>(() => {
  return {
    name: 'default',
    pluginName: 'plugin-zod',
    default(name, type) {
      if (type === 'file') return toFilePath(name, (part) => camelCase(part, { suffix: 'schema' }))
      return ensureValidVarName(camelCase(name, { suffix: type ? 'schema' : undefined }))
    },
    resolveSchemaName(name) {
      return ensureValidVarName(camelCase(name, { suffix: 'schema' }))
    },
    resolveSchemaTypeName(name) {
      return ensureValidVarName(pascalCase(name, { suffix: 'schema type' }))
    },
    resolveInputSchemaName(name) {
      return this.resolveSchemaName(`${name} input`)
    },
    resolveInputSchemaTypeName(name) {
      return this.resolveSchemaTypeName(`${name} input`)
    },
    resolveTypeName(name) {
      return ensureValidVarName(pascalCase(name, { suffix: 'type' }))
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
    resolveErrorName(node) {
      return this.resolveSchemaName(`${node.operationId} Error`)
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
