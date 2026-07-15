import { createCasedFile, createOperationParamResolver, createOperationResponseResolver } from '@internals/shared'
import { camelCase, ensureValidVarName, pascalCase } from '@internals/utils'
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
  file: createCasedFile((part) => camelCase(part, { suffix: 'schema' })),
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
  param: createOperationParamResolver(),
  response: {
    ...createOperationResponseResolver(),
    error(node) {
      return this.name(`${node.operationId} Error`)
    },
    options(node) {
      return this.schema.type(this.name(`${node.operationId} Options`))
    },
  },
})
