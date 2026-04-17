import { camelCase } from '@internals/utils'
import { definePlugin, type Group } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { fakerGenerator } from './generators/fakerGenerator.tsx'
import { resolverFaker } from './resolvers/resolverFaker.ts'
import type { PluginFaker } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-faker`, used to identify the plugin in driver lookups and warnings.
 */
export const pluginFakerName = 'plugin-faker' satisfies PluginFaker['name']

/**
 * The `@kubb/plugin-faker` plugin factory.
 *
 * Generates Faker mock helpers from schema and operation AST nodes.
 *
 * @example
 * ```ts
 * import pluginFaker from '@kubb/plugin-faker'
 *
 * export default defineConfig({
 *   plugins: [pluginFaker({ output: { path: 'mocks' } })],
 * })
 * ```
 */
export const pluginFaker = definePlugin<PluginFaker>((options) => {
  const {
    output = { path: 'mocks', barrelType: 'named' },
    seed,
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
    : undefined

  return {
    name: pluginFakerName,
    options,
    dependencies: [pluginTsName],
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({
          output,
          seed,
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
