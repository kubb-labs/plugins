import { createGroupConfig } from '@internals/shared'
import { addGenerator, defineExtension, Resolver, setMacros, setResolver } from 'kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { pluginTsName } from '@kubb/plugin-ts'
import { cypressGenerator } from './generators/cypressGenerator.tsx'
import { resolverCypress } from './resolvers/resolverCypress.ts'
import type { PluginCypress, ResolverCypress } from './types.ts'

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
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginCypress } from '@kubb/plugin-cypress'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
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
export const pluginCypress = defineExtension<PluginCypress>({
  kind: 'plugin',
  meta: { name: pluginCypressName, version, compatibility },
  dependencies: { [pluginTsName]: {} },
  setup(options) {
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

    const resolver = userResolver ? Resolver.merge<ResolverCypress>(resolverCypress, userResolver) : resolverCypress

    setResolver(resolver)
    if (userMacros?.length) {
      setMacros(userMacros)
    }
    addGenerator(cypressGenerator)

    return {
      output,
      exclude,
      include,
      override,
      group: createGroupConfig(group),
      baseURL,
    }
  },
})

export default pluginCypress
