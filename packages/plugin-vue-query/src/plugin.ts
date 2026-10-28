import { createGroupConfig } from '@internals/shared'
import { addGenerator, defineExtension, Resolver, setMacros, setResolver, useConfig } from 'kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
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
export const pluginVueQuery = defineExtension<PluginVueQuery>({
  kind: 'plugin',
  meta: { name: pluginVueQueryName, version, compatibility },
  dependencies: { [pluginTsName]: { optional: true } },
  setup(options) {
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

    const resolver = userResolver ? Resolver.merge<ResolverVueQuery>(resolverVueQuery, userResolver) : resolverVueQuery

    setResolver(resolver)
    if (userMacros?.length) {
      setMacros(userMacros)
    }

    addGenerator(queryGenerator, infiniteQueryGenerator, mutationGenerator)

    return {
      output,
      client: resolveContractClient({ plugin: pluginVueQueryName, client, plugins: useConfig().plugins }),
      queryKey,
      query: resolveQueryConfig(query, { importPath: '@tanstack/vue-query' }),
      mutationKey,
      mutation: resolveMutationConfig(mutation, { importPath: '@tanstack/vue-query' }),
      infinite: resolveInfiniteConfig(infinite),
      hooks,
      group: createGroupConfig(group),
      exclude,
      include,
      override,
      resolver,
    }
  },
})

export default pluginVueQuery
