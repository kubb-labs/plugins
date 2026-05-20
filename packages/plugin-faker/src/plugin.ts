import { camelCase } from '@internals/utils'
import { definePlugin, type Group } from '@kubb/core'
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
 * `createPet()` to get a realistic `Pet` object — useful for tests, Storybook,
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
    output = { path: 'mocks', barrelType: 'named' },
    seed,
    locale,
    group,
    exclude = [],
    include,
    override = [],
    mapper = {},
    dateParser = 'faker',
    generators: userGenerators = [],
    regexGenerator = 'faker',
    paramsCasing,
    printer,
    resolver: userResolver,
    transformer: userTransformer,
  } = options

  const groupConfig = group
    ? ({
        ...group,
        name: group.name
          ? group.name
          : (ctx: { group: string }) => {
              if (group.type === 'path') {
                return `${ctx.group.split('/')[1]}`
              }

              return `${camelCase(ctx.group)}Controller`
            },
      } satisfies Group)
    : null

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
          paramsCasing,
          printer,
        })
        ctx.setResolver(userResolver ? { ...resolverFaker, ...userResolver } : resolverFaker)
        if (userTransformer) {
          ctx.setTransformer(userTransformer)
        }
        ctx.addGenerator(fakerGenerator)
        for (const generator of userGenerators) {
          ctx.addGenerator(generator)
        }
      },
    },
  }
})

export default pluginFaker
