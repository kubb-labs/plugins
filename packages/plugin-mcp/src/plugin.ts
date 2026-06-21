import { createGroupConfig } from '@internals/shared'

import { resolveClient } from '@internals/client'
import { definePlugin } from '@kubb/core'
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
 * Code, MCP-compatible clients) can call directly. Each handler calls a contract
 * client `<op>` from a registered `@kubb/plugin-axios` or `@kubb/plugin-fetch`.
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
        const resolver = userResolver ? { ...resolverMcp, ...userResolver } : resolverMcp

        const pluginNames = (ctx.config.plugins ?? []).map((p) => (p as { name?: string }).name).filter((name): name is string => Boolean(name))
        const resolvedClient = resolveClient({ client, pluginNames })
        if (resolvedClient.kind === 'error') {
          throw new Error(resolvedClient.message)
        }

        // The handlers always call a registered client plugin's op; the client runtime lives in
        // plugin-axios / plugin-fetch, so nothing is bundled here.
        const resolvedClientDescriptor: PluginMcp['resolvedOptions']['client'] = { kind: 'contract', pluginName: resolvedClient.pluginName }

        ctx.setOptions({
          output,
          exclude,
          include,
          override,
          group: groupConfig,
          client: resolvedClientDescriptor,
          resolver,
        })
        ctx.setResolver(resolver)
        if (userMacros?.length) {
          ctx.setMacros(userMacros)
        }
        ctx.addGenerator(mcpGenerator)
        ctx.addGenerator(serverGenerator)
      },
    },
  }
})

export default pluginMcp
