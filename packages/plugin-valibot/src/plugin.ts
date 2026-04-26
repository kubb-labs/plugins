import { camelCase } from '@internals/utils'
import { definePlugin, type Group } from '@kubb/core'
import { valibotGenerator } from './generators/valibotGenerator.tsx'
import { resolverValibot } from './resolvers/resolverValibot.ts'
import type { PluginValibot } from './types.ts'

export const pluginValibotName = 'plugin-valibot' satisfies PluginValibot['name']

export const pluginValibot = definePlugin<PluginValibot>((options) => {
  const {
    output = { path: 'valibot', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    dateType = 'string',
    typed = false,
    operations = false,
    guidType = 'uuid',
    optionalType = 'optional',
    defaultMode = 'default',
    metadata = { description: true },
    readonly = false,
    importPath = 'valibot',
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
    name: pluginValibotName,
    options,
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({
          output,
          exclude,
          include,
          override,
          group: groupConfig,
          dateType,
          typed,
          importPath,
          coercion,
          operations,
          inferred,
          guidType,
          optionalType,
          defaultMode,
          metadata,
          readonly,
          wrapOutput,
          paramsCasing,
          printer,
        })
        ctx.setResolver(userResolver ? { ...resolverValibot, ...userResolver } : resolverValibot)
        if (userTransformer) {
          ctx.setTransformer(userTransformer)
        }
        ctx.addGenerator(valibotGenerator)
        for (const gen of userGenerators) {
          ctx.addGenerator(gen)
        }
      },
    },
  }
})

export default pluginValibot
