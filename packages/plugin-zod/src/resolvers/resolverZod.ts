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
 * resolverZod.core.name('list pets') // 'listPetsSchema'
 * resolverZod.resolveSchemaTypeName('pet')     // 'PetSchemaType'
 * ```
 */
export const resolverZod = defineResolver<PluginZod>(() => {
  return {
    name: 'default',
    pluginName: 'plugin-zod',
    core: {
      name(name) {
        return ensureValidVarName(camelCase(name, { suffix: 'schema' }))
      },
      fileName(name) {
        return toFilePath(name, (part) => camelCase(part, { suffix: 'schema' }))
      },
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
    resolveParamName(node, param) {
      return this.resolveSchemaName(`${node.operationId} ${param.in} ${param.name}`)
    },
    resolveResponseStatusName(node, statusCode) {
      return this.resolveSchemaName(`${node.operationId} Status ${statusCode}`)
    },
    resolveBodyName(node) {
      return this.resolveSchemaName(`${node.operationId} Body`)
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
    resolvePathName(node, param) {
      return this.resolveParamName(node, param)
    },
    resolveQueryName(node, param) {
      return this.resolveParamName(node, param)
    },
    resolveHeadersName(node, param) {
      return this.resolveParamName(node, param)
    },
  }
})
