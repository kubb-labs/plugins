import path from 'node:path'
import { createGroupConfig } from '@internals/shared'

import { ast, definePlugin } from '@kubb/core'
import { pluginClientName } from '@kubb/plugin-client'
import { axiosClientTemplatePath, configTemplatePath, fetchClientTemplatePath } from '@kubb/plugin-client/templates'
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
 * import { pluginClient } from '@kubb/plugin-client'
 * import { pluginZod } from '@kubb/plugin-zod'
 * import { pluginMcp } from '@kubb/plugin-mcp'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginClient(),
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
    paramsCasing,
    client,
    resolver: userResolver,
    macros: userMacros,
    generators: userGenerators = [],
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
          paramsCasing,
          client: {
            client: clientName,
            clientType: client?.clientType ?? 'function',
            importPath: clientImportPath,
            dataReturnType: client?.dataReturnType ?? 'data',
            baseURL: client?.baseURL,
            paramsCasing: client?.paramsCasing,
          },
          resolver,
        })
        ctx.setResolver(resolver)
        if (userMacros?.length) {
          ctx.setMacros(userMacros)
        }
        ctx.addGenerator(mcpGenerator)
        ctx.addGenerator(serverGenerator)
        for (const gen of userGenerators) {
          ctx.addGenerator(gen)
        }

        const root = path.resolve(ctx.config.root, ctx.config.output.path)
        const hasClientPlugin = ctx.config.plugins?.some((p) => p.name === pluginClientName)

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

export default pluginMcp
