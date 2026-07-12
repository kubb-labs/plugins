import { createGroupConfig } from '@internals/shared'
import { definePlugin, Resolver } from 'kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { mutationKeyTransformer, queryKeyTransformer, resolveInfiniteConfig, resolveMutationConfig, resolveQueryConfig } from '@internals/tanstack-query'
import { resolveContractClient } from '@internals/client'
import { infiniteQueryGenerator, mutationGenerator, queryGenerator } from './generators'
import { resolverVueQuery } from './resolvers/resolverVueQuery.ts'
import type { PluginVueQuery, ResolverVueQuery } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-vue-query`. Used for driver lookups
 * and cross-plugin dependency references.
 */
export const pluginVueQueryName = 'plugin-vue-query' satisfies PluginVueQuery['name']

/**
 * Generates one TanStack Query composable per OpenAPI operation for Vue's
 * Composition API. Queries become `useFoo` (and optionally
 * `useFooInfinite`). Mutations become `useFoo` as well. Each composable
 * is fully typed end to end.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginVueQuery } from '@kubb/plugin-vue-query'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
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
    infinite = false,
    mutation = {},
    query = {},
    mutationKey = mutationKeyTransformer,
    queryKey = queryKeyTransformer,
    hooks = false,
    client,
    resolver: userResolver,
    macros: userMacros,
  } = options

  const selectedGenerators = [queryGenerator, infiniteQueryGenerator, mutationGenerator]

  const groupConfig = createGroupConfig(group)

  return {
    name: pluginVueQueryName,
    options,
    dependencies: [pluginTsName],
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? Resolver.merge<ResolverVueQuery>(resolverVueQuery, userResolver) : resolverVueQuery

        ctx.setOptions({
          output,
          client: resolveContractClient({ client, plugins: ctx.config.plugins }),
          queryKey,
          query: resolveQueryConfig(query, { importPath: '@tanstack/vue-query' }),
          mutationKey,
          mutation: resolveMutationConfig(mutation, { importPath: '@tanstack/vue-query' }),
          infinite: resolveInfiniteConfig(infinite),
          hooks,
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

        ctx.addGenerator(...selectedGenerators)
      },
    },
  }
})

export default pluginVueQuery
