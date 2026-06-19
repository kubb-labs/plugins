import path from 'node:path'
import { createGroupConfig } from '@internals/shared'
import { ast, definePlugin } from '@kubb/core'
import { isParserEnabled, pluginClientName } from '@kubb/plugin-client'
import { axiosClientTemplatePath, configTemplatePath, fetchClientTemplatePath } from '@kubb/plugin-client/templates'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
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
import type { PluginReactQuery } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-react-query`. Used for driver lookups
 * and cross-plugin dependency references.
 */
export const pluginReactQueryName = 'plugin-react-query' satisfies PluginReactQuery['name']

/**
 * Generates one TanStack Query hook per OpenAPI operation for React. Queries
 * become `useFooQuery`/`useFooSuspenseQuery`/`useFooInfiniteQuery`; mutations
 * become `useFooMutation`. Each hook is fully typed: query keys, input
 * variables, response data, and error shape all come from the spec.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginReactQuery } from '@kubb/plugin-react-query'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
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
    parser = false,
    suspense = {},
    infinite = false,
    mutation = {},
    query = {},
    mutationKey = mutationKeyTransformer,
    queryKey = queryKeyTransformer,
    customOptions,
    client,
    resolver: userResolver,
    macros: userMacros,
    generators: userGenerators = [],
  } = options

  const clientName = client?.client ?? 'axios'
  const clientImportPath = client?.importPath

  const selectedGenerators =
    options.generators ??
    [
      queryGenerator,
      suspenseQueryGenerator,
      infiniteQueryGenerator,
      suspenseInfiniteQueryGenerator,
      mutationGenerator,
      hookOptionsGenerator,
      customHookOptionsFileGenerator,
    ].filter((generator): generator is NonNullable<typeof generator> => Boolean(generator))

  const groupConfig = createGroupConfig(group)

  return {
    name: pluginReactQueryName,
    options,
    dependencies: [pluginTsName, isParserEnabled(parser) ? pluginZodName : undefined].filter((dependency): dependency is string => Boolean(dependency)),
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...resolverReactQuery, ...userResolver } : resolverReactQuery

        ctx.setOptions({
          output,
          client: {
            baseURL: client?.baseURL,
            client: clientName,
            clientType: client?.clientType ?? 'function',
            importPath: clientImportPath,
            dataReturnType: client?.dataReturnType ?? 'data',
          },
          queryKey,
          query:
            query === false
              ? false
              : {
                  importPath: '@tanstack/react-query',
                  methods: ['get'],
                  ...query,
                },
          mutationKey,
          mutation:
            mutation === false
              ? false
              : {
                  importPath: '@tanstack/react-query',
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
          suspense,
          customOptions: customOptions ? { name: 'useCustomHookOptions', ...customOptions } : null,
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
        for (const gen of userGenerators) {
          ctx.addGenerator(gen)
        }

        const root = path.resolve(ctx.config.root, ctx.config.output.path)
        const hasClientPlugin = !!ctx.config.plugins?.some((p) => (p as { name?: string }).name === pluginClientName)

        if (!hasClientPlugin && !clientImportPath) {
          ctx.injectFile({
            baseName: 'client.ts',
            path: path.resolve(root, '.kubb/client.ts'),
            copy: clientName === 'fetch' ? fetchClientTemplatePath : axiosClientTemplatePath,
            sources: [
              ast.factory.createSource({
                name: 'client',
                nodes: [],
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
            copy: configTemplatePath,
            sources: [
              ast.factory.createSource({
                name: 'config',
                nodes: [],
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

export default pluginReactQuery
