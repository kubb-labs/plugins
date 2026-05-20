import path from 'node:path'
import { camelCase } from '@internals/utils'

import { ast, definePlugin, type Group } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { classClientGenerator } from './generators/classClientGenerator.tsx'
import { clientGenerator } from './generators/clientGenerator.tsx'
import { groupedClientGenerator } from './generators/groupedClientGenerator.tsx'
import { operationsGenerator } from './generators/operationsGenerator.tsx'
import { staticClassClientGenerator } from './generators/staticClassClientGenerator.tsx'
import { resolverClient } from './resolvers/resolverClient.ts'
import { source as axiosClientSource } from './templates/clients/axios.source.ts'
import { source as fetchClientSource } from './templates/clients/fetch.source.ts'
import { source as configSource } from './templates/config.source.ts'
import type { PluginClient } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-client`, used in driver lookups and warnings.
 */
export const pluginClientName = 'plugin-client' satisfies PluginClient['name']

/**
 * Generates type-safe HTTP client functions or classes from an OpenAPI specification.
 * Creates client APIs by walking operations and delegating to generators.
 * Writes barrel files based on the configured `barrelType`.
 *
 * @example Client generator
 * ```ts
 * import pluginClient from '@kubb/plugin-client'
 * export default defineConfig({
 *   plugins: [pluginClient({ output: { path: 'clients' } })]
 * })
 * ```
 */
export const pluginClient = definePlugin<PluginClient>((options) => {
  const {
    output = { path: 'clients', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    urlType = false,
    dataReturnType = 'data',
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    operations = false,
    paramsCasing,
    clientType = options.sdk ? 'class' : 'function',
    parser = 'client',
    client = 'axios',
    importPath,
    bundle = false,
    sdk,
    baseURL,
    resolver: userResolver,
    transformer: userTransformer,
  } = options

  const resolvedImportPath = importPath ?? (!bundle ? `@kubb/plugin-client/clients/${client}` : undefined)

  const selectedGenerators =
    options.generators ??
    [
      clientType === 'staticClass' ? staticClassClientGenerator : clientType === 'class' ? classClientGenerator : clientGenerator,
      group && clientType === 'function' ? groupedClientGenerator : null,
      operations ? operationsGenerator : null,
    ].filter((x): x is NonNullable<typeof x> => Boolean(x))

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
    : null

  return {
    name: pluginClientName,
    options,
    dependencies: [pluginTsName, parser === 'zod' ? pluginZodName : null].filter((dependency): dependency is string => Boolean(dependency)),
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...resolverClient, ...userResolver } : resolverClient

        ctx.setOptions({
          client,
          clientType,
          bundle,
          output,
          exclude,
          include,
          override,
          group: groupConfig,
          parser,
          dataReturnType,
          importPath: resolvedImportPath,
          baseURL,
          paramsType,
          paramsCasing,
          pathParamsType,
          urlType,
          sdk,
          resolver,
        })
        ctx.setResolver(resolver)
        if (userTransformer) {
          ctx.setTransformer(userTransformer)
        }
        for (const gen of selectedGenerators) {
          ctx.addGenerator(gen)
        }

        const root = path.resolve(ctx.config.root, ctx.config.output.path)

        const isRelativePath = resolvedImportPath?.startsWith('.')

        if (!isRelativePath) {
          const isInlineSource = bundle && !resolvedImportPath

          ctx.injectFile({
            baseName: 'client.ts',
            path: path.resolve(root, '.kubb/client.ts'),
            sources: [
              ast.createSource({
                name: 'client',
                nodes: isInlineSource ? [ast.createText(client === 'fetch' ? fetchClientSource : axiosClientSource)] : [],
                isExportable: true,
                isIndexable: true,
              }),
            ],
            exports: !isInlineSource && resolvedImportPath ? [ast.createExport({ path: resolvedImportPath })] : [],
          })
        }

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
      },
    },
  }
})

export default pluginClient
