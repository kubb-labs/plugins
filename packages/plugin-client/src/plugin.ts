import path from 'node:path'
import { createGroupConfig } from '@internals/shared'

import { definePlugin } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { classClientGenerator } from './generators/classClientGenerator.tsx'
import { clientGenerator } from './generators/clientGenerator.tsx'
import { groupedClientGenerator } from './generators/groupedClientGenerator.tsx'
import { operationsGenerator } from './generators/operationsGenerator.ts'
import { staticClassClientGenerator } from './generators/staticClassClientGenerator.tsx'
import { resolverClient } from './resolvers/resolverClient.ts'
import { contractAxiosClientTemplatePath, contractFetchClientTemplatePath } from './templates.ts'
import type { PluginClient } from './types.ts'
import { isParserEnabled } from './utils.ts'

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
    output = { path: 'clients', barrel: { type: 'named' } },
    group,
    exclude = [],
    include,
    override = [],
    operations = false,
    clientType = options.sdk ? 'class' : 'function',
    parser = false,
    client = 'axios',
    importPath,
    sdk,
    baseURL,
    resolver: userResolver,
    macros: userMacros,
  } = options

  // Without `importPath` the client runtime is bundled into `.kubb/client.ts`. Any `importPath`
  // opts out: the generated code imports the client from that module and nothing is bundled.
  const resolvedImportPath = importPath

  const selectedGenerators = [
    clientType === 'staticClass' ? staticClassClientGenerator : clientType === 'class' ? classClientGenerator : clientGenerator,
    group && clientType === 'function' ? groupedClientGenerator : null,
    operations ? operationsGenerator : null,
  ].filter((x): x is NonNullable<typeof x> => Boolean(x))

  const groupConfig = createGroupConfig(group)

  return {
    name: pluginClientName,
    options,
    dependencies: [pluginTsName, isParserEnabled(parser) ? pluginZodName : null].filter((dependency): dependency is string => Boolean(dependency)),
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...resolverClient, ...userResolver } : resolverClient

        ctx.setOptions({
          client,
          clientType,
          output,
          exclude,
          include,
          override,
          group: groupConfig,
          parser,
          importPath: resolvedImportPath,
          baseURL,
          sdk,
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

        // Only emit the bundled client when no `importPath` is set. Any `importPath` makes the
        // generated code import the client from there, so no `.kubb/client.ts` is written. The
        // bundled runtime is the shared `RequestResult` contract, the same template plugin-fetch
        // and plugin-axios inject, so the contract serializes form-data in its own runtime and no
        // separate `config.ts` is needed.
        if (!resolvedImportPath) {
          ctx.injectFile({
            baseName: 'client.ts',
            path: path.resolve(root, '.kubb/client.ts'),
            copy: client === 'fetch' ? contractFetchClientTemplatePath : contractAxiosClientTemplatePath,
            footer: baseURL ? `client.setConfig({ baseURL: ${JSON.stringify(baseURL)} })` : undefined,
          })
        }
      },
    },
  }
})

export default pluginClient
