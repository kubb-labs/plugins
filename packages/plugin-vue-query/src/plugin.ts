import path from 'node:path'
import { camelCase } from '@internals/utils'
import { ast, definePlugin, type Group } from '@kubb/core'
import { pluginClientName } from '@kubb/plugin-client'
import { source as axiosClientSource } from '@kubb/plugin-client/templates/clients/axios.source'
import { source as fetchClientSource } from '@kubb/plugin-client/templates/clients/fetch.source'
import { source as configSource } from '@kubb/plugin-client/templates/config.source'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { MutationKey } from './components/MutationKey.tsx'
import { QueryKey } from './components/QueryKey.tsx'
import { infiniteQueryGenerator, mutationGenerator, queryGenerator } from './generators'
import { resolverVueQuery } from './resolvers/resolverVueQuery.ts'
import { resolverVueQueryLegacy } from './resolvers/resolverVueQueryLegacy.ts'
import type { PluginVueQuery } from './types.ts'

export const pluginVueQueryName = 'plugin-vue-query' satisfies PluginVueQuery['name']

export const pluginVueQuery = definePlugin<PluginVueQuery>((options) => {
  const {
    output = { path: 'hooks', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    parser = 'client',
    infinite = false,
    transformers = {},
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    mutation = {},
    query = {},
    mutationKey = MutationKey.getTransformer,
    queryKey = QueryKey.getTransformer,
    paramsCasing,
    client,
    resolver: userResolver,
    transformer: userTransformer,
    generators: userGenerators = [],
    compatibilityPreset = 'default',
  } = options

  const defaultResolver = compatibilityPreset === 'kubbV4' ? resolverVueQueryLegacy : resolverVueQuery

  const clientName = client?.client ?? 'axios'
  const clientImportPath = client?.importPath ?? (!client?.bundle ? `@kubb/plugin-client/clients/${clientName}` : undefined)

  const selectedGenerators = options.generators ?? [queryGenerator, infiniteQueryGenerator, mutationGenerator].filter(Boolean)

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
    name: pluginVueQueryName,
    options,
    dependencies: [pluginTsName, parser === 'zod' ? pluginZodName : undefined].filter(Boolean),
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...defaultResolver, ...userResolver } : defaultResolver

        ctx.setOptions({
          output,
          transformers,
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
                cursorParam: undefined,
                nextParam: undefined,
                previousParam: undefined,
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
            baseName: 'fetch.ts',
            path: path.resolve(root, '.kubb/fetch.ts'),
            sources: [
              ast.createSource({
                name: 'fetch',
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
