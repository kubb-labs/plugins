import { createGroupConfig } from '@internals/shared'
import { definePlugin, Resolver } from 'kubb/kit'
import { resolveContractClient } from '@internals/client'
import { pluginTsName } from '@kubb/plugin-ts'
import {
  createOperationDispatcher,
  mutationKeyTransformer,
  queryKeyTransformer,
  resolveInfiniteConfig,
  resolveMutationConfig,
  resolveQueryConfig,
} from '@internals/tanstack-query'
import {
  customHookOptionsFileGenerator,
  hookOptionsGenerator,
  infiniteQueryGenerator,
  mutationGenerator,
  queryGenerator,
  suspenseInfiniteQueryGenerator,
  suspenseQueryGenerator,
} from './generators'
import { resolverReactQuery } from './resolvers/resolverReactQuery.ts'
import type { PluginReactQuery, ResolverReactQuery } from './types.ts'

const operationGenerator = createOperationDispatcher<PluginReactQuery>({
  name: 'react-query-operation',
  queryGenerators: [queryGenerator, suspenseQueryGenerator, infiniteQueryGenerator, suspenseInfiniteQueryGenerator],
  mutationGenerators: [mutationGenerator],
})

/**
 * Canonical plugin name for `@kubb/plugin-react-query`. Used for driver lookups
 * and cross-plugin dependency references.
 */
export const pluginReactQueryName = 'plugin-react-query' satisfies PluginReactQuery['name']

/**
 * Generates one TanStack Query hook per OpenAPI operation for React. Queries
 * become `useFoo`, with `useFooSuspense` and `useFooInfinite` variants.
 * Mutations become `useFoo`. Each hook is fully typed: query keys, input
 * variables, response data, and error shape all come from the spec.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginReactQuery } from '@kubb/plugin-react-query'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginReactQuery({
 *       output: { path: './hooks' },
 *       suspense: {},
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginReactQuery = definePlugin<PluginReactQuery>((options) => {
  const {
    output = { path: 'hooks', barrel: { type: 'named' } },
    group,
    exclude = [],
    include,
    override = [],
    suspense = false,
    infinite = false,
    mutation = {},
    query = {},
    mutationKey = mutationKeyTransformer,
    queryKey = queryKeyTransformer,
    customOptions,
    hooks = false,
    client,
    resolver: userResolver,
    macros: userMacros,
  } = options

  const selectedGenerators = [operationGenerator, hookOptionsGenerator, customHookOptionsFileGenerator]

  const groupConfig = createGroupConfig(group)

  return {
    name: pluginReactQueryName,
    options,
    dependencies: [pluginTsName],
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? Resolver.merge<ResolverReactQuery>(resolverReactQuery, userResolver) : resolverReactQuery

        ctx.setOptions({
          output,
          client: resolveContractClient({ client, plugins: ctx.config.plugins }),
          queryKey,
          query: resolveQueryConfig(query, { importPath: '@tanstack/react-query' }),
          mutationKey,
          mutation: resolveMutationConfig(mutation, { importPath: '@tanstack/react-query' }),
          infinite: resolveInfiniteConfig(infinite),
          suspense,
          customOptions: customOptions ? { name: 'useCustomHookOptions', ...customOptions } : null,
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

export default pluginReactQuery
