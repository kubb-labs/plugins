import path from 'node:path'
import { createGroupConfig } from '@internals/shared'

import { ast, definePlugin } from '@kubb/core'
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
 * Canonical plugin name for `@kubb/plugin-client`. Used for driver lookups and
 * cross-plugin dependency references.
 */
export const pluginClientName = 'plugin-client' satisfies PluginClient['name']

/**
 * Generates one HTTP client function per OpenAPI operation. Each function has
 * typed path params, query params, body, and response, so callers use the API
 * like any other typed function. Ships with `axios` and `fetch` runtimes; bring
 * your own by setting `importPath`.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginClient } from '@kubb/plugin-client'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginClient({
 *       output: { path: './clients' },
 *       client: 'fetch',
 *     }),
 *   ],
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

  const groupConfig = createGroupConfig(group, { suffix: 'Controller', honorName: true })

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
