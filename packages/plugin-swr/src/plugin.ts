import { createGroupConfig } from '@internals/shared'
import { definePlugin, Resolver } from 'kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { resolveContractClient } from '@internals/client'
import { mutationKeyTransformer, queryKeyTransformer, resolveMutationConfig, resolveQueryConfig } from '@internals/tanstack-query'
import { mutationGenerator, queryGenerator } from './generators'
import { resolverSwr } from './resolvers/resolverSwr.ts'
import type { PluginSwr, ResolverSwr } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-swr`. Used for driver lookups and cross-plugin
 * dependency references.
 */
export const pluginSwrName = 'plugin-swr' satisfies PluginSwr['name']

/**
 * Generates SWR hooks from OpenAPI operations. Read operations become `useFoo` hooks built on
 * `useSWR` and write operations become `useFoo` hooks built on `useSWRMutation`, wrapping the
 * client functions from `@kubb/plugin-axios` or `@kubb/plugin-fetch`.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginSwr } from '@kubb/plugin-swr'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginSwr({ output: { path: './hooks' } }),
 *   ],
 * })
 * ```
 */
export const pluginSwr = definePlugin<PluginSwr>((options) => {
  const {
    output = { path: 'hooks', barrel: { type: 'named' } },
    group,
    exclude = [],
    include,
    override = [],
    mutation = {},
    query = {},
    mutationKey = mutationKeyTransformer,
    queryKey = queryKeyTransformer,
    client,
    resolver: userResolver,
    macros: userMacros,
  } = options

  const selectedGenerators = [queryGenerator, mutationGenerator]

  const groupConfig = createGroupConfig(group) ?? undefined

  return {
    name: pluginSwrName,
    options,
    dependencies: [pluginTsName],
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? Resolver.merge<ResolverSwr>(resolverSwr, userResolver) : resolverSwr

        ctx.setOptions({
          output,
          client: resolveContractClient({ client, plugins: ctx.config.plugins }),
          queryKey,
          query: resolveQueryConfig(query, { importPath: 'swr' }),
          mutationKey,
          mutation: resolveMutationConfig(mutation, { importPath: 'swr/mutation' }),
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

export default pluginSwr
