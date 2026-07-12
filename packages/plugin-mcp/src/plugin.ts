import { createGroupConfig } from '@internals/shared'

import { resolveContractClient } from '@internals/client'
import { definePlugin, Resolver } from 'kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { mcpGenerator } from './generators/mcpGenerator.tsx'
import { serverGenerator } from './generators/serverGenerator.tsx'
import { resolverMcp } from './resolvers/resolverMcp.ts'
import type { PluginMcp, ResolverMcp } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-mcp`. Used for driver lookups and
 * cross-plugin dependency references.
 */
export const pluginMcpName = 'plugin-mcp' satisfies PluginMcp['name']

/**
 * Generates a Model Context Protocol (MCP) server from an OpenAPI spec. Every
 * operation becomes a typed MCP tool that AI assistants (Claude Desktop, Claude
 * Code, MCP-compatible clients) can call directly. Each handler calls a contract
 * client `<op>` from a registered `@kubb/plugin-axios` or `@kubb/plugin-fetch`.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginZod } from '@kubb/plugin-zod'
 * import { pluginMcp } from '@kubb/plugin-mcp'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginZod(),
 *     pluginMcp({
 *       output: { path: './mcp' },
 *       baseURL: 'https://petstore.swagger.io/v2',
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

  const groupConfig = createGroupConfig(group)

  return {
    name: pluginMcpName,
    options,
    dependencies: [pluginTsName, pluginZodName],
    hooks: {
      'kubb:plugin:setup'(ctx) {
        const resolver = userResolver ? Resolver.merge<ResolverMcp>(resolverMcp, userResolver) : resolverMcp

        ctx.setOptions({
          output,
          exclude,
          include,
          override,
          group: groupConfig,
          client: resolveContractClient({ client, plugins: ctx.config.plugins }),
          resolver,
        })
        ctx.setResolver(resolver)
        if (userMacros?.length) {
          ctx.setMacros(userMacros)
        }
        ctx.addGenerator(mcpGenerator, serverGenerator)
      },
    },
  }
})

export default pluginMcp
