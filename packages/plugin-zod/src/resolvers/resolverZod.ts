import { camelCase, ensureValidVarName, pascalCase, toFilePath } from '@internals/utils'
import { createResolver } from 'kubb/kit'
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
 * resolverZod.name('list pets')          // 'listPetsSchema'
 * resolverZod.schema.typeName('pet')     // 'PetSchemaType'
 * ```
 */
export const resolverZod = createResolver<PluginZod>({
  pluginName: 'plugin-zod',
  name(name) {
    return ensureValidVarName(camelCase(name, { suffix: 'schema' }))
  },
  file: {
    baseName({ name, extname }) {
      return `${toFilePath(name, (part) => camelCase(part, { suffix: 'schema' }))}${extname}`
    },
  },
  schema: {
    typeName(name) {
      return ensureValidVarName(pascalCase(name, { suffix: 'schema type' }))
    },
    type(name) {
      return ensureValidVarName(pascalCase(name, { suffix: 'type' }))
    },
    inputName(name) {
      return this.name(`${name} input`)
    },
    inputTypeName(name) {
      return this.schema.typeName(`${name} input`)
    },
  },
  param: {
    name(node, param) {
      return this.name(`${node.operationId} ${param.in} ${param.name}`)
    },
    path(node, param) {
      return this.param.name(node, param)
    },
    query(node, param) {
      return this.param.name(node, param)
    },
    headers(node, param) {
      return this.param.name(node, param)
    },
  },
  response: {
    status(node, statusCode) {
      return this.name(`${node.operationId} Status ${statusCode}`)
    },
    body(node) {
      return this.name(`${node.operationId} Body`)
    },
    responses(node) {
      return this.name(`${node.operationId} Responses`)
    },
    response(node) {
      return this.name(`${node.operationId} Response`)
    },
    error(node) {
      return this.name(`${node.operationId} Error`)
    },
  },
})
