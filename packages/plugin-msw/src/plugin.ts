import { camelCase } from '@internals/utils'
import { definePlugin, type Group } from '@kubb/core'
import { pluginFakerName } from '@kubb/plugin-faker'
import { pluginTsName } from '@kubb/plugin-ts'
import { handlersGenerator, mswGenerator } from './generators'
import { resolverMsw } from './resolvers/resolverMsw.ts'
import type { PluginMsw } from './types.ts'

export const pluginMswName = 'plugin-msw' satisfies PluginMsw['name']

export const pluginMsw = definePlugin<PluginMsw>((options) => {
  const {
    output = { path: 'handlers', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    transformers = {},
    handlers = false,
    parser = 'data',
    baseURL,
    resolver: userResolver,
    transformer: userTransformer,
    generators: userGenerators = [],
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
    name: pluginMswName,
    options,
    dependencies: [pluginTsName, parser === 'faker' ? pluginFakerName : undefined].filter(Boolean),
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...resolverMsw, ...userResolver } : resolverMsw

        ctx.setOptions({
          output,
          parser,
          baseURL,
          group: groupConfig,
          exclude,
          include,
          override,
          handlers,
          transformers,
          resolver,
        })
        ctx.setResolver(resolver)
        if (userTransformer) {
          ctx.setTransformer(userTransformer)
        }

        ctx.addGenerator(mswGenerator)
        if (handlers) {
          ctx.addGenerator(handlersGenerator)
        }
        for (const gen of userGenerators) {
          ctx.addGenerator(gen)
        }
      },
    },
  }
})

export default pluginMsw
