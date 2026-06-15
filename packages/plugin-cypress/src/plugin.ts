import { createGroupConfig } from '@internals/shared'
import { definePlugin } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { cypressGenerator } from './generators/cypressGenerator.tsx'
import { resolverCypress } from './resolvers/resolverCypress.ts'
import type { PluginCypress } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-cypress`. Used for driver lookups and
 * cross-plugin dependency references.
 */
export const pluginCypressName = 'plugin-cypress' satisfies PluginCypress['name']

/**
 * Generates one typed `cy.request()` wrapper per OpenAPI operation. Each helper
 * has typed path params, body, query, and a typed response, so failing API
 * calls in Cypress show up at compile time instead of inside the test runner.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginCypress } from '@kubb/plugin-cypress'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginCypress({
 *       output: { path: './cypress' },
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginCypress = definePlugin<PluginCypress>((options) => {
  const {
    output = { path: 'cypress', barrel: { type: 'named' } },
    group,
    exclude = [],
    include,
    override = [],
    dataReturnType = 'data',
    baseURL,
    paramsCasing,
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    resolver: userResolver,
    macros: userMacros,
    generators: userGenerators = [],
  } = options

  const groupConfig = createGroupConfig(group)

  return {
    name: pluginCypressName,
    options,
    dependencies: [pluginTsName],
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...resolverCypress, ...userResolver } : resolverCypress

        ctx.setOptions({
          output,
          exclude,
          include,
          override,
          dataReturnType,
          group: groupConfig,
          baseURL,
          paramsCasing,
          paramsType,
          pathParamsType,
          resolver,
        })
        ctx.setResolver(resolver)
        if (userMacros?.length) {
          ctx.setMacros(userMacros)
        }
        ctx.addGenerator(cypressGenerator)
        for (const gen of userGenerators) {
          ctx.addGenerator(gen)
        }
      },
    },
  }
})

export default pluginCypress
