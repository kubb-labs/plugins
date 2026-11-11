import { getResponseHeadersTypeNames, type OperationTypeNames, type OperationTypeSource } from '@internals/client'
import { operationKey, resolveOperationFile } from '@internals/shared'
import type { ast, Generator } from '@kubb/kit'
import { pluginZodName } from '@kubb/plugin-zod'
import type { ContractClientFactory } from '../types.ts'
import { getOperationSecurity, type SecurityRequirement } from './security.ts'
import { getOperationBaseURL, type ServerOptions } from './server.ts'
import { buildValidatorHooks, type ValidatorHooks } from './validator.ts'
import { isValidatorEnabled } from './validatorOptions.ts'

export type GeneratorContext = Parameters<NonNullable<Generator<ContractClientFactory>['operations']>>[1]

export type OperationData = {
  node: ast.HttpOperationNode
  name: string
  types: OperationTypeNames
  typeFile: ast.FileNode
  /** `null` unless `validator` turns a direction on. */
  zodFile: ast.FileNode | null
  validatorHooks: ValidatorHooks
  /** The names of the headers types the result references. */
  headerTypeNames: Array<string>
  security?: Array<SecurityRequirement>
  baseURL?: string
}

/**
 * Resolves what the function and SDK generators both print for one operation: its name, the files its types and zod
 * schemas come from, and its validator hooks, security, base URL and response headers types.
 */
export function resolveOperationData({ node, ctx, types }: { node: ast.HttpOperationNode; ctx: GeneratorContext; types: OperationTypeSource }): OperationData {
  const { driver, resolver, root } = ctx
  const { output, validator, importPath } = ctx.options
  const pluginZod = isValidatorEnabled(validator) ? driver.getPlugin(pluginZodName) : null
  const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : null

  return {
    node,
    name: resolver.resolveName({ key: operationKey(node), name: resolver.name(node.operationId) }),
    types,
    typeFile: resolveOperationFile({ ctx, node, resolver: types.resolver, root, output: types.output ?? output, group: types.group }),
    zodFile:
      zodResolver && pluginZod?.options
        ? resolveOperationFile({
            ctx,
            node,
            resolver: zodResolver,
            root,
            output: pluginZod.options.output ?? output,
            group: pluginZod.options.group ?? undefined,
          })
        : null,
    validatorHooks: buildValidatorHooks({ node, validator, zodResolver }),
    headerTypeNames: getResponseHeadersTypeNames({ node, types }),
    // The fetch and axios clients write `securitySchemes` into `.kubb/client.ts`. A custom client module has none.
    security: getOperationSecurity({ auth: node.auth, schemes: ctx.meta.auth, hoist: importPath === undefined }),
    baseURL: getOperationBaseURL({ servers: node.servers, server: (ctx.adapter.options as { server?: ServerOptions } | undefined)?.server }),
  }
}
