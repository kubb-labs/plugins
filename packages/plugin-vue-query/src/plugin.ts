import path from 'node:path'
import { createGroupConfig } from '@internals/shared'
import { ast, definePlugin } from '@kubb/core'
import { pluginClientName } from '@kubb/plugin-client'
import { source as axiosClientSource } from '@kubb/plugin-client/templates/clients/axios.source'
import { source as fetchClientSource } from '@kubb/plugin-client/templates/clients/fetch.source'
import { source as configSource } from '@kubb/plugin-client/templates/config.source'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { mutationKeyTransformer } from '@internals/tanstack-query'
import { queryKeyTransformer } from '@internals/tanstack-query'
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
    output = { path: 'hooks', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    parser = 'client',
    infinite = false,
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    mutation = {},
    query = {},
    mutationKey = mutationKeyTransformer,
    queryKey = queryKeyTransformer,
    paramsCasing,
    client,
    resolver: userResolver,
    transformer: userTransformer,
    generators: userGenerators = [],
  } = options

  const clientName = client?.client ?? 'axios'
  const clientImportPath = client?.importPath ?? (!client?.bundle ? `@kubb/plugin-client/clients/${clientName}` : undefined)

  const selectedGenerators =
    options.generators ??
    [queryGenerator, infiniteQueryGenerator, mutationGenerator].filter((generator): generator is NonNullable<typeof generator> => Boolean(generator))

  const groupConfig = createGroupConfig(group, { suffix: 'Controller', honorName: true })

  return {
    name: pluginVueQueryName,
    options,
    dependencies: [pluginTsName, parser === 'zod' ? pluginZodName : undefined].filter((dependency): dependency is string => Boolean(dependency)),
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...resolverVueQuery, ...userResolver } : resolverVueQuery

        ctx.setOptions({
          output,
          client: {
            bundle: client?.bundle,
            baseURL: client?.baseURL,
            client: clientName,
            clientType: client?.clientType ?? 'function',
            importPath: clientImportPath,
            dataReturnType: client?.dataReturnType ?? 'data',
            paramsCasing,
          },
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
          paramsType,
          pathParamsType,
          paramsCasing,
          group: groupConfig,
          exclude,
          include,
          override,
          resolver,
        })
        ctx.setResolver(resolver)
        if (userTransformer) {
          ctx.setTransformer(userTransformer)
        }

        for (const gen of selectedGenerators) {
          ctx.addGenerator(gen)
        }
        for (const gen of userGenerators) {
          ctx.addGenerator(gen)
        }

        const root = path.resolve(ctx.config.root, ctx.config.output.path)
        const hasClientPlugin = !!ctx.config.plugins?.some((p) => (p as { name?: string }).name === pluginClientName)

        if (client?.bundle && !hasClientPlugin && !clientImportPath) {
          ctx.injectFile({
            baseName: 'client.ts',
            path: path.resolve(root, '.kubb/client.ts'),
            sources: [
              ast.createSource({
                name: 'client',
                nodes: [ast.createText(clientName === 'fetch' ? fetchClientSource : axiosClientSource)],
                isExportable: true,
                isIndexable: true,
              }),
            ],
          })
        }

        if (!hasClientPlugin) {
          ctx.injectFile({
            baseName: 'config.ts',
            path: path.resolve(root, '.kubb/config.ts'),
            sources: [
              ast.createSource({
                name: 'config',
                nodes: [ast.createText(configSource)],
                isExportable: false,
                isIndexable: false,
              }),
            ],
          })
        }
      },
    },
  }
})

export default pluginVueQuery
