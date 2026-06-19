import path from 'node:path'
import { createGroupConfig } from '@internals/shared'
import { ast, definePlugin } from '@kubb/core'
import { isParserEnabled, pluginClientName } from '@kubb/plugin-client'
import { axiosClientTemplatePath, configTemplatePath, fetchClientTemplatePath } from '@kubb/plugin-client/templates'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import { mutationGenerator, queryGenerator } from './generators'
import { resolverSwr } from './resolvers/resolverSwr.ts'
import type { PluginSwr } from './types.ts'

export const pluginSwrName = 'plugin-swr' satisfies PluginSwr['name']

export const pluginSwr = definePlugin<PluginSwr>((options) => {
  const {
    output = { path: 'hooks', barrel: { type: 'named' } },
    group,
    exclude = [],
    include,
    override = [],
    parser = false,
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    mutation = {},
    query = {},
    mutationKey = mutationKeyTransformer,
    queryKey = queryKeyTransformer,
    paramsCasing,
    client,
    resolver: userResolver,
    macros: userMacros,
  } = options

  const clientName = client?.client ?? 'axios'
  const clientImportPath = client?.importPath

  const selectedGenerators = [queryGenerator, mutationGenerator].filter((generator): generator is NonNullable<typeof generator> => Boolean(generator))

  const groupConfig = createGroupConfig(group) ?? undefined

  return {
    name: pluginSwrName,
    options,
    dependencies: [pluginTsName, isParserEnabled(parser) ? pluginZodName : undefined].filter((dependency): dependency is string => Boolean(dependency)),
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...resolverSwr, ...userResolver } : resolverSwr

        ctx.setOptions({
          output,
          client: {
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
        if (userMacros?.length) {
          ctx.setMacros(userMacros)
        }

        for (const gen of selectedGenerators) {
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

export default pluginSwr
