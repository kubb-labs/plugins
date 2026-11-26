import { ast } from '@internals/ast'
import { getResponseHeadersTypeNames, type OperationTypeNames, type OperationTypeSource } from '@internals/client'
import { operationKey, type RefName, type TemplateContext } from '@kubb/kit'
import type { ContractClientFactory } from '../types.ts'
import { getOperationSecurity, isAuthRequired, type SecurityRequirement } from './security.ts'
import { buildValidatorHooks, type ValidatorHooks } from './validator.ts'
import { pluginValibotName, pluginZodName, resolveValidatorLibrary } from './validatorLibrary.ts'

export type OperationData = {
  node: ast.HttpOperationNode
  name: string
  types: OperationTypeNames
  /**
   * The options, responses and headers type names, each with its import.
   */
  typeNames: Array<RefName>
  /**
   * Empty unless `validator` turns a direction on.
   */
  schemaNames: Array<RefName>
  validatorHooks: ValidatorHooks
  /**
   * The names of the headers types the result references.
   */
  headerTypeNames: Array<string>
  security?: Array<SecurityRequirement>
  authRequired: boolean
  baseURL?: string
}

export type ResolveOperationDataOptions = {
  node: ast.HttpOperationNode
  ctx: TemplateContext<ContractClientFactory>
  types: OperationTypeSource
  custom?: boolean
}

/**
 * Resolves what the function and SDK generators both print for one operation: its name, its type and schema names, each with
 * its import, and its validator hooks, security, base URL and response headers types.
 */
export function resolveOperationData({ node, ctx, types, custom = false }: ResolveOperationDataOptions): OperationData {
  const { validator } = ctx.options
  const library = resolveValidatorLibrary(validator)
  const schemaPlugin = library === 'valibot' ? ctx.getPlugin(pluginValibotName) : library === 'zod' ? ctx.getPlugin(pluginZodName) : null
  const schemaResolver = !schemaPlugin ? null : library === 'valibot' ? ctx.getResolver(pluginValibotName) : ctx.getResolver(pluginZodName)

  const validatorHooks = buildValidatorHooks({ node, validator, schemaResolver })
  const headerTypeNames = getResponseHeadersTypeNames({ node, types })
  const typeSource = ctx.from('types')
  const schemas = schemaResolver && schemaPlugin?.options ? ctx.from(schemaResolver.pluginName) : null

  return {
    node,
    name: ctx.resolver.resolveName({ key: operationKey(node), name: ctx.resolver.name(node.operationId) }),
    types,
    typeNames: [
      typeSource.resolver.response.options(node),
      typeSource.resolver.response.responses(node),
      ...headerTypeNames.map((name) => typeSource.ref(node, name)),
    ],
    schemaNames: schemas ? validatorHooks.importedSchemaNames.map((name) => schemas.ref(node, name)) : [],
    validatorHooks,
    headerTypeNames,
    // The fetch, axios, and ky runtimes write `securitySchemes` into `.kubb/client.ts`. A custom client module has none.
    security: getOperationSecurity({ auth: node.auth, schemes: ctx.meta.auth, hoist: !custom }),
    authRequired: ctx.options.auth.mode === 'required' && isAuthRequired({ auth: node.auth, schemes: ctx.meta.auth }),
    baseURL: ast.http.getBaseURL(ast.server.get({ servers: node.servers, index: ctx.meta.serverIndex })),
  }
}
