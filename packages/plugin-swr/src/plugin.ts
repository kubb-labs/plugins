import path from 'node:path'
import { createGroupConfig } from '@internals/shared'
import { definePlugin } from '@kubb/core'
import { isParserEnabled } from '@internals/client'
import { axiosClientTemplatePath } from '@kubb/plugin-axios'
import { fetchClientTemplatePath } from '@kubb/plugin-fetch'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { mutationKeyTransformer, queryKeyTransformer, resolveClient } from '@internals/tanstack-query'
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
    dependencies: [pluginTsName, isParserEnabled(parser) ? pluginZodName : undefined].filter((dependency): dependency is string => Boolean(dependency)),
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...resolverSwr, ...userResolver } : resolverSwr

        const pluginNames = (ctx.config.plugins ?? []).map((p) => (p as { name?: string }).name).filter((name): name is string => Boolean(name))
        const resolvedClient = resolveClient({ client, pluginNames })
        if (resolvedClient.kind === 'error') {
          throw new Error(resolvedClient.message)
        }

        // `contract` calls a registered plugin's op; `contract-inline` bundles its own runtime,
        // defaulting to axios (the historical default) since no client plugin is in play.
        const resolvedClientDescriptor: PluginSwr['resolvedOptions']['client'] =
          resolvedClient.kind === 'contract' ? { kind: 'contract', pluginName: resolvedClient.pluginName } : { kind: 'contract-inline', client: 'axios' }

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

        const root = path.resolve(ctx.config.root, ctx.config.output.path)

        // `contract-inline` bundles the shared `RequestResult` contract runtime, identical to what
        // plugin-fetch / plugin-axios inject, so the inline op serializes form-data in its own runtime
        // and needs no `config.ts`.
        if (resolvedClientDescriptor.kind === 'contract-inline') {
          ctx.injectFile({
            baseName: 'client.ts',
            path: path.resolve(root, '.kubb/client.ts'),
            copy: resolvedClientDescriptor.client === 'fetch' ? fetchClientTemplatePath : axiosClientTemplatePath,
          })
        }
      },
    },
  }
})

export default pluginSwr
