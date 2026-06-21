import { createGroupConfig } from '@internals/shared'
import { definePlugin } from '@kubb/core'
import { isParserEnabled } from '@internals/client'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { mutationKeyTransformer } from '@internals/tanstack-query'
import { queryKeyTransformer } from '@internals/tanstack-query'
import { resolveClient } from '@internals/client'
import { infiniteQueryGenerator, mutationGenerator, queryGenerator } from './generators'
import { resolverVueQuery } from './resolvers/resolverVueQuery.ts'
import type { PluginVueQuery } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-vue-query`. Used for driver lookups
 * and cross-plugin dependency references.
 */
export const pluginVueQueryName = 'plugin-vue-query' satisfies PluginVueQuery['name']

/**
 * Generates one TanStack Query composable per OpenAPI operation for Vue's
 * Composition API. Queries become `useFooQuery` (and optionally
 * `useFooInfiniteQuery`); mutations become `useFooMutation`. Each composable
 * is fully typed end to end.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginVueQuery } from '@kubb/plugin-vue-query'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginVueQuery({
 *       output: { path: './hooks' },
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginVueQuery = definePlugin<PluginVueQuery>((options) => {
  const {
    output = { path: 'hooks', barrel: { type: 'named' } },
    group,
    exclude = [],
    include,
    override = [],
    parser = false,
    infinite = false,
    mutation = {},
    query = {},
    mutationKey = mutationKeyTransformer,
    queryKey = queryKeyTransformer,
    client,
    resolver: userResolver,
    macros: userMacros,
  } = options

  const selectedGenerators = [queryGenerator, infiniteQueryGenerator, mutationGenerator].filter((generator): generator is NonNullable<typeof generator> =>
    Boolean(generator),
  )

  const groupConfig = createGroupConfig(group)

  return {
    name: pluginVueQueryName,
    options,
    dependencies: [pluginTsName, isParserEnabled(parser) ? pluginZodName : undefined].filter((dependency): dependency is string => Boolean(dependency)),
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...resolverVueQuery, ...userResolver } : resolverVueQuery

        const pluginNames = (ctx.config.plugins ?? []).map((p) => (p as { name?: string }).name).filter((name): name is string => Boolean(name))
        const resolvedClient = resolveClient({ client, pluginNames })
        if (resolvedClient.kind === 'error') {
          throw new Error(resolvedClient.message)
        }

        // The hooks always call a registered client plugin's op; the client runtime lives in
        // plugin-axios / plugin-fetch, so nothing is bundled here.
        const resolvedClientDescriptor: PluginVueQuery['resolvedOptions']['client'] = { kind: 'contract', pluginName: resolvedClient.pluginName }

        ctx.setOptions({
          output,
          client: resolvedClientDescriptor,
          queryKey,
          query:
            query === false
              ? false
              : {
                  importPath: '@tanstack/vue-query',
                  methods: ['get'],
                  ...query,
                },
          mutationKey,
          mutation:
            mutation === false
              ? false
              : {
                  importPath: '@tanstack/vue-query',
                  methods: ['post', 'put', 'patch', 'delete'],
                  ...mutation,
                },
          infinite: infinite
            ? {
                queryParam: 'id',
                initialPageParam: 0,
                cursorParam: null,
                nextParam: null,
                previousParam: null,
                ...infinite,
              }
            : false,
          parser,
          group: groupConfig,
          exclude,
          include,
          override,
          resolver,
        })
        ctx.setResolver(resolver)
        if (userMacros?.length) {
          ctx.setMacros(userMacros)
        }

        for (const gen of selectedGenerators) {
          ctx.addGenerator(gen)
        }
      },
    },
  }
})

export default pluginVueQuery
