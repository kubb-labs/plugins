import { camelCase } from '@internals/utils'
import { definePlugin, type Group } from '@kubb/core'
import { zodGenerator } from './generators/zodGenerator.tsx'
import { resolverZod } from './resolvers/resolverZod.ts'
import type { PluginZod } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-zod`, used in driver lookups and warnings.
 */
export const pluginZodName = 'plugin-zod' satisfies PluginZod['name']

/**
 * Generates Zod validation schemas from an OpenAPI specification.
 * Walks schemas and operations, delegates to generators, and writes barrel files
 * based on the configured `barrelType`.
 *
 * @example Zod schema generator
 * ```ts
 * import pluginZod from '@kubb/plugin-zod'
 * export default defineConfig({
 *   plugins: [pluginZod({ output: { path: 'zod' } })]
 * })
 * ```
 */
export const pluginZod = definePlugin<PluginZod>((options) => {
  const {
    output = { path: 'zod', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    typed = false,
    operations = false,
    mini = false,
    guidType = 'uuid',
    importPath = mini ? 'zod/mini' : 'zod',
    coercion = false,
    inferred = false,
    wrapOutput = undefined,
    paramsCasing,
    printer,
    resolver: userResolver,
    transformer: userTransformer,
    generators: userGenerators = [],
  } = options

  const groupConfig = group
    ? ({
        ...group,
        name: (ctx) => {
          if (group.type === 'path') {
            return `${ctx.group.split('/')[1]}`
          }
          return `${camelCase(ctx.group)}Controller`
        },
      } satisfies Group)
    : undefined

  return {
    name: pluginZodName,
    options,
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({
          output,
          exclude,
          include,
          override,
          group: groupConfig,
          typed,
          importPath,
          coercion,
          operations,
          inferred,
          guidType,
          mini,
          wrapOutput,
          paramsCasing,
          printer,
        })
        ctx.setResolver(userResolver ? { ...resolverZod, ...userResolver } : resolverZod)
        if (userTransformer) {
          ctx.setTransformer(userTransformer)
        }
        ctx.addGenerator(zodGenerator)
        for (const gen of userGenerators) {
          ctx.addGenerator(gen)
        }
      },
    },
  }
})

export default pluginZod
