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
    baseURL,
    resolver: userResolver,
    macros: userMacros,
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
          group: groupConfig,
          baseURL,
          resolver,
        })
        ctx.setResolver(resolver)
        if (userMacros?.length) {
          ctx.setMacros(userMacros)
        }
        ctx.addGenerator(cypressGenerator)
      },
    },
  }
})

export default pluginCypress
