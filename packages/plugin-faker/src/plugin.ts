import { createGroupConfig } from '@internals/shared'
import { definePlugin } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { fakerGenerator } from './generators/fakerGenerator.tsx'
import { resolverFaker } from './resolvers/resolverFaker.ts'
import type { PluginFaker } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-faker`. Used for driver lookups and
 * cross-plugin dependency references.
 */
export const pluginFakerName = 'plugin-faker' satisfies PluginFaker['name']

/**
 * Generates one mock-data factory per OpenAPI schema using Faker.js. Call
 * `createPet()` to get a realistic `Pet` object. Useful for tests, Storybook,
 * and local development without a running backend.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginFaker } from '@kubb/plugin-faker'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginFaker({
 *       output: { path: './mocks' },
 *       seed: [100],
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginFaker = definePlugin<PluginFaker>((options) => {
  const {
    output = { path: 'mocks', barrel: { type: 'named' } },
    seed,
    locale = 'en',
    group,
    exclude = [],
    include,
    override = [],
    mapper = {},
    dateParser = 'faker',
    regexGenerator = 'faker',
    printer,
    resolver: userResolver,
    macros: userMacros,
  } = options

  const groupConfig = createGroupConfig(group)

  return {
    name: pluginFakerName,
    options,
    dependencies: [pluginTsName],
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({
          output,
          seed,
          locale,
          exclude,
          include,
          override,
          group: groupConfig,
          mapper,
          dateParser,
          regexGenerator,
          printer,
        })
        ctx.setResolver(userResolver ? { ...resolverFaker, ...userResolver } : resolverFaker)
        if (userMacros?.length) {
          ctx.setMacros(userMacros)
        }
        ctx.addGenerator(fakerGenerator)
      },
    },
  }
})

export default pluginFaker
