import { createGroupConfig } from '@internals/shared'
import { definePlugin } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { resolveClient } from '@internals/client'
import { mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import { mutationGenerator, queryGenerator } from './generators'
import { resolverSwr } from './resolvers/resolverSwr.ts'
import type { PluginSwr } from './types.ts'

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
 * import { defineConfig } from 'kubb'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginSwr } from '@kubb/plugin-swr'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
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

  const selectedGenerators = [queryGenerator, mutationGenerator].filter((generator): generator is NonNullable<typeof generator> => Boolean(generator))

  const groupConfig = createGroupConfig(group) ?? undefined

  return {
    name: pluginSwrName,
    options,
    dependencies: [pluginTsName],
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...resolverSwr, ...userResolver } : resolverSwr

        const pluginNames = (ctx.config.plugins ?? []).map((p) => (p as { name?: string }).name).filter((name): name is string => Boolean(name))
        const resolvedClient = resolveClient({ client, pluginNames })
        if (resolvedClient.kind === 'error') {
          throw new Error(resolvedClient.message)
        }

        // The hooks always call a registered client plugin's op. The client runtime lives in
        // plugin-axios / plugin-fetch, so nothing is bundled here.
        const resolvedClientDescriptor: PluginSwr['resolvedOptions']['client'] = { kind: 'contract', pluginName: resolvedClient.pluginName }

        ctx.setOptions({
          output,
          client: resolvedClientDescriptor,
          queryKey,
          query:
            query === false
              ? false
              : {
                  importPath: 'swr',
                  methods: ['get'],
                  ...query,
                },
          mutationKey,
          mutation:
            mutation === false
              ? false
              : {
                  importPath: 'swr/mutation',
                  methods: ['post', 'put', 'patch', 'delete'],
                  ...mutation,
                },
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
