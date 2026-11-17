import { getResponseHeadersTypeNames, type OperationTypeNames, type OperationTypeSource } from '@internals/client'
import { operationKey, resolveOperationFile } from '@internals/shared'
import { ast, type Generator } from '@kubb/kit'
import { pluginValibotName } from '@kubb/plugin-valibot'
import { pluginZodName } from '@kubb/plugin-zod'
import type { ContractClientFactory } from '../types.ts'
import { getOperationSecurity, isAuthRequired, type SecurityRequirement } from './security.ts'
import { buildValidatorHooks, type ValidatorHooks } from './validator.ts'
import { resolveValidatorLibrary } from './validatorOptions.ts'

export type GeneratorContext = Parameters<NonNullable<Generator<ContractClientFactory>['operations']>>[1]

export type OperationData = {
  node: ast.HttpOperationNode
  name: string
  types: OperationTypeNames
  typeFile: ast.FileNode
  /**
   * `null` unless `validator` turns a direction on.
   */
  schemaFile: ast.FileNode | null
  validatorHooks: ValidatorHooks
  /**
   * The names of the headers types the result references.
   */
  headerTypeNames: Array<string>
  security?: Array<SecurityRequirement>
  authRequired: boolean
  baseURL?: string
}

/**
 * Resolves what the function and SDK generators both print for one operation: its name, the files its types and validator
 * schemas come from, and its validator hooks, security, base URL and response headers types.
 */
export function resolveOperationData({ node, ctx, types }: { node: ast.HttpOperationNode; ctx: GeneratorContext; types: OperationTypeSource }): OperationData {
  const { resolver, root } = ctx
  const { output, validator, importPath } = ctx.options
  // One branch per library: `getPlugin` and `getResolver` are typed by the literal plugin name.
  const library = resolveValidatorLibrary(validator)
  const schemaPlugin = library === 'valibot' ? ctx.getPlugin(pluginValibotName) : library === 'zod' ? ctx.getPlugin(pluginZodName) : null
  const schemaResolver = !schemaPlugin ? null : library === 'valibot' ? ctx.getResolver(pluginValibotName) : ctx.getResolver(pluginZodName)

  return {
    node,
    name: resolver.resolveName({ key: operationKey(node), name: resolver.name(node.operationId) }),
    types,
    typeFile: resolveOperationFile({ ctx, node, resolver: types.resolver, root, output: types.output ?? output, group: types.group }),
    schemaFile:
      schemaResolver && schemaPlugin?.options
        ? resolveOperationFile({
            ctx,
            node,
            resolver: schemaResolver,
            root,
            output: schemaPlugin.options.output ?? output,
            group: schemaPlugin.options.group ?? undefined,
          })
        : null,
    validatorHooks: buildValidatorHooks({ node, validator, schemaResolver }),
    headerTypeNames: getResponseHeadersTypeNames({ node, types }),
    // The fetch and axios clients write `securitySchemes` into `.kubb/client.ts`. A custom client module has none.
    security: getOperationSecurity({ auth: node.auth, schemes: ctx.meta.auth, hoist: importPath === undefined }),
    authRequired: ctx.options.auth.mode === 'required' && isAuthRequired({ auth: node.auth, schemes: ctx.meta.auth }),
    baseURL: ast.http.getBaseURL(
      ast.server.get({ servers: node.servers, index: (ctx.adapter.options as { server?: { index?: number } } | undefined)?.server?.index }),
    ),
  }
}
