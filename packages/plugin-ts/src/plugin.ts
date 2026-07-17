import { createGroupConfig } from '@internals/shared'
import { definePlugin, Resolver } from 'kubb/kit'
import { typeGenerator } from './generators/typeGenerator.tsx'
import { resolverTs } from './resolvers/resolverTs.ts'
import type { PluginTs } from './types.ts'

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
        ctx.setResolver(userResolver ? Resolver.merge(resolverTs, userResolver) : resolverTs)
        if (userMacros?.length) {
          ctx.setMacros(userMacros)
        }
        ctx.addGenerator(typeGenerator)
      },
    },
  }
})

export default pluginTs
