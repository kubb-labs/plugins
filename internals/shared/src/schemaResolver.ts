import type { ast } from '@internals/ast'
import { ensureValidVarName } from '@internals/utils'
import { casing, createResolver, operationKey, resolverCasedFile, resolverOperationParams, resolverOperationResponse } from '@kubb/kit'
import type { PluginType, Resolver } from '@kubb/kit'

type SchemaResolver = Resolver & {
  schema: Record<'typeName' | 'type' | 'inputName' | 'inputTypeName' | 'isName' | 'assertName', (name: string) => string>
  response: Record<'error' | 'options', (node: ast.OperationNode) => string>
}

/**
 * The resolver of a validator plugin, such as `@kubb/plugin-zod`. Schema and file names are camelCase with a `Schema`
 * suffix, and inferred types are PascalCase with a `SchemaType` suffix, so a value and its type never share a name.
 */
export function createSchemaResolver<TPlugin extends PluginType>(pluginName: TPlugin['name']): TPlugin['resolver'] {
  // The type names get their own memo keys, apart from the schema names of the same input.
  const key = (kind: string, name: string): string => `${pluginName}:${kind}:${name}`

  return createResolver<PluginType<string, object, object, SchemaResolver>>({
    pluginName,
    name(name) {
      return this.memo(`name:${name}`, () => ensureValidVarName(casing.camel(name, { suffix: 'schema' })))
    },
    ...resolverCasedFile((part) => casing.camel(part, { suffix: 'schema' })),
    schema: {
      typeName(name) {
        return this.memo(key('typeName', name), () => ensureValidVarName(casing.pascal(name, { suffix: 'schema type' })))
      },
      type(name) {
        return this.memo(key('type', name), () => ensureValidVarName(casing.pascal(name, { suffix: 'type' })))
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
}
