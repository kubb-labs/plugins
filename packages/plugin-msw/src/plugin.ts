import { camelCase } from '@internals/utils'
import { definePlugin, type Group } from '@kubb/core'
import { pluginFakerName } from '@kubb/plugin-faker'
import { pluginTsName } from '@kubb/plugin-ts'
import { handlersGenerator, mswGenerator } from './generators'
import { resolverMsw } from './resolvers/resolverMsw.ts'
import type { PluginMsw } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-msw`. Used for driver lookups and
 * cross-plugin dependency references.
 */
export const pluginMswName = 'plugin-msw' satisfies PluginMsw['name']

/**
 * Generates MSW request handlers from an OpenAPI spec. Drop them into your
 * test setup or service worker to mock the API end-to-end — request path,
 * method, status, and response body all stay in sync with the spec. Combine
 * with `@kubb/plugin-faker` (via `parser: 'faker'`) to seed handlers with
 * realistic data.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginMsw } from '@kubb/plugin-msw'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginMsw({
 *       output: { path: './handlers' },
 *       handlers: true,
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginMsw = definePlugin<PluginMsw>((options) => {
  const {
    output = { path: 'handlers', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
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
    : null

  return {
    name: pluginMswName,
    options,
    dependencies: [pluginTsName, parser === 'faker' ? pluginFakerName : null].filter((dependency): dependency is string => Boolean(dependency)),
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
