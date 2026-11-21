import { ensureValidVarName } from '@internals/utils'
import { casing, createResolver, operationKey, resolverCasedFile, resolverOperationParams, resolverOperationResponse } from '@kubb/kit'
import { pluginValibotName } from '../plugin.ts'
import type { PluginValibot } from '../types.ts'

/**
 * Default resolver for `@kubb/plugin-valibot`. Schema and file names are camelCase with a `Schema`
 * suffix, and inferred types are PascalCase.
 *
 * @example
 * ```ts
 * resolverValibot.name('list pets') // 'listPetsSchema'
 * resolverValibot.schema.typeName('pet') // 'PetSchemaType'
 * ```
 */
export const resolverValibot = createResolver<PluginValibot>({
  pluginName: 'plugin-valibot',
  name(name) {
    return this.memo(`name:${name}`, () => ensureValidVarName(casing.camel(name, { suffix: 'schema' })))
  },
  ...resolverCasedFile((part) => casing.camel(part, { suffix: 'schema' })),
  schema: {
    typeName(name) {
      return this.memo(`${pluginValibotName}:typeName:${name}`, () => ensureValidVarName(casing.pascal(name, { suffix: 'schema type' })))
    },
    type(name) {
      return this.memo(`${pluginValibotName}:type:${name}`, () => ensureValidVarName(casing.pascal(name, { suffix: 'type' })))
    },
    inputName(name) {
      return this.name(`${name} input`)
    },
    inputTypeName(name) {
      return this.schema.typeName(`${name} input`)
    },
    isName(name) {
      return ensureValidVarName(casing.camel(name, { prefix: 'is' }))
    },
    assertName(name) {
      return ensureValidVarName(casing.camel(name, { prefix: 'assert' }))
    },
  },
  ...resolverOperationParams,
  response: {
    ...resolverOperationResponse.response,
    error(node) {
      const name = this.name(`${node.operationId} Error`)
      return this.resolveName({ key: operationKey(node, 'response', 'error'), name })
    },
    options(node) {
      const name = this.schema.type(this.name(`${node.operationId} Options`))
      return this.resolveName({ key: operationKey(node, 'response', 'options'), name })
    },
  },
})
