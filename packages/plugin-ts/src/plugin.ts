import { createGroupConfig, resolveInlinableRefName } from '@internals/shared'
import { definePlugin, Resolver } from 'kubb/kit'
import { typeGenerator } from './generators/typeGenerator.tsx'
import { resolverTs } from './resolvers/resolverTs.ts'
import type { PluginTs, ResolverTs } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-ts`. Used for driver lookups and
 * cross-plugin dependency references.
 */
export const pluginTsName = 'plugin-ts' satisfies PluginTs['name']

/**
 * Default for the `operationTypes` option. Kept `true` so generated output is unchanged unless a
 * user opts into inlining. Consumer plugins import this to resolve the same default when the option
 * is left unset (`pluginTs.options?.operationTypes ?? defaultOperationTypes`).
 */
export const defaultOperationTypes = true

/**
 * Generates TypeScript `type` aliases and `interface` declarations from an
 * OpenAPI spec. The foundation that every other Kubb plugin builds on:
 * clients, query hooks, mocks, and validators all reference the names this
 * plugin produces.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs({
 *       output: { path: './types' },
 *       enum: { type: 'asConst' },
 *       optionalType: 'questionTokenAndUndefined',
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginTs = definePlugin<PluginTs>((options) => {
  const {
    output = { path: 'types', barrel: { type: 'named' } },
    group,
    exclude = [],
    include,
    override = [],
    enum: enumOptions = {},
    optionalType = 'questionToken',
    arrayType = 'array',
    syntaxType = 'type',
    operationTypes = defaultOperationTypes,
    printer,
    resolver: userResolver,
    macros: userMacros,
  } = options

  const groupConfig = createGroupConfig(group)

  const resolvedEnum = {
    type: enumOptions.type ?? 'asConst',
    constCasing: enumOptions.constCasing ?? 'camelCase',
    typeSuffix: enumOptions.typeSuffix ?? 'Key',
    keyCasing: enumOptions.keyCasing ?? 'none',
  }

  return {
    name: pluginTsName,
    options,
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({
          output,
          exclude,
          include,
          override,
          optionalType,
          group: groupConfig,
          arrayType,
          enum: resolvedEnum,
          syntaxType,
          operationTypes,
          printer,
        })
        // When inlining, the resolved response/body type names become the referenced base component,
        // so every consumer plugin reading this resolver references `Pet` instead of `AddPetStatus200`.
        const inlineResolver = operationTypes
          ? resolverTs
          : Resolver.merge(resolverTs, {
              response: {
                body(this: ResolverTs, node) {
                  const inlineName = resolveInlinableRefName(node.requestBody?.content)
                  return inlineName ? this.name(inlineName) : resolverTs.response.body(node)
                },
                status(this: ResolverTs, node, statusCode) {
                  const response = node.responses.find((res) => res.statusCode === statusCode)
                  const inlineName = response ? resolveInlinableRefName(response.content) : null
                  return inlineName ? this.name(inlineName) : resolverTs.response.status(node, statusCode)
                },
              },
            })
        ctx.setResolver(userResolver ? Resolver.merge(inlineResolver, userResolver) : inlineResolver)
        if (userMacros?.length) {
          ctx.setMacros(userMacros)
        }
        ctx.addGenerator(typeGenerator)
      },
    },
  }
})

export default pluginTs
