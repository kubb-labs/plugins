import path from 'node:path'
import { createGroupConfig } from '@internals/shared'

import { ast, definePlugin } from '@kubb/core'
import { axiosClientTemplatePath, pluginAxiosName } from '@kubb/plugin-axios'
import { fetchClientTemplatePath, pluginFetchName } from '@kubb/plugin-fetch'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { mcpGenerator } from './generators/mcpGenerator.tsx'
import { serverGenerator } from './generators/serverGenerator.tsx'
import { resolverMcp } from './resolvers/resolverMcp.ts'
import type { PluginMcp } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-mcp`. Used for driver lookups and
 * cross-plugin dependency references.
 */
export const pluginMcpName = 'plugin-mcp' satisfies PluginMcp['name']

/**
 * Generates a Model Context Protocol (MCP) server from an OpenAPI spec. Every
 * operation becomes a typed MCP tool that AI assistants (Claude Desktop, Claude
 * Code, MCP-compatible clients) can call directly.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginZod } from '@kubb/plugin-zod'
 * import { pluginMcp } from '@kubb/plugin-mcp'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginZod(),
 *     pluginMcp({
 *       output: { path: './mcp' },
 *       client: { baseURL: 'https://petstore.swagger.io/v2' },
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginMcp = definePlugin<PluginMcp>((options) => {
  const {
    output = { path: 'mcp', barrel: { type: 'named' } },
    group,
    exclude = [],
    include,
    override = [],
    client,
    resolver: userResolver,
    macros: userMacros,
  } = options

  const clientName = client?.client ?? 'axios'
  const clientImportPath = client?.importPath

  const groupConfig = createGroupConfig(group)

  return {
    name: pluginMcpName,
    options,
    dependencies: [pluginTsName, pluginZodName],
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? { ...resolverMcp, ...userResolver } : resolverMcp

        ctx.setOptions({
          output,
          exclude,
          include,
          override,
          group: groupConfig,
          client: {
            client: clientName,
            importPath: clientImportPath,
            baseURL: client?.baseURL,
          },
          resolver,
        })
        ctx.setResolver(resolver)
        if (userMacros?.length) {
          ctx.setMacros(userMacros)
        }
        ctx.addGenerator(mcpGenerator)
        ctx.addGenerator(serverGenerator)

        const root = path.resolve(ctx.config.root, ctx.config.output.path)
        const hasClientPlugin = ctx.config.plugins?.some((p) => p.name === pluginAxiosName || p.name === pluginFetchName)

        // Without a registered client plugin or an `importPath`, bundle the shared `RequestResult`
        // contract runtime as `.kubb/client.ts` — the same template plugin-fetch and plugin-axios
        // inject. The contract serializes form-data in its own runtime, so no separate `config.ts`
        // is needed.
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
      },
    },
  }
})

export default pluginMcp
