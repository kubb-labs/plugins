import path from 'node:path'
import { createGroupConfig } from '@internals/shared'

import { resolveClient } from '@internals/client'
import { ast, definePlugin } from '@kubb/core'
import { axiosClientTemplatePath } from '@kubb/plugin-axios'
import { fetchClientTemplatePath } from '@kubb/plugin-fetch'
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
 * client `<op>` from `@kubb/plugin-axios` / `@kubb/plugin-fetch`, or emits its own
 * inline contract client when none is registered.
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
    baseURL,
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

        // `contract` calls a registered plugin's op; `contract-inline` bundles its own runtime,
        // defaulting to axios (the historical default) since no client plugin is in play.
        const resolvedClientDescriptor: PluginMcp['resolvedOptions']['client'] =
          resolvedClient.kind === 'contract' ? { kind: 'contract', pluginName: resolvedClient.pluginName } : { kind: 'contract-inline', client: 'axios' }

        ctx.setOptions({
          output,
          exclude,
          include,
          override,
          group: groupConfig,
          client: resolvedClientDescriptor,
          baseURL,
          resolver,
        })
        ctx.setResolver(resolver)
        if (userMacros?.length) {
          ctx.setMacros(userMacros)
        }
        ctx.addGenerator(mcpGenerator)
        ctx.addGenerator(serverGenerator)

        const root = path.resolve(ctx.config.root, ctx.config.output.path)

        // `contract-inline` bundles the shared `RequestResult` contract runtime, identical to what
        // plugin-fetch / plugin-axios inject, so the inline op serializes form-data in its own
        // runtime and needs no `config.ts`.
        if (resolvedClientDescriptor.kind === 'contract-inline') {
          ctx.injectFile({
            baseName: 'client.ts',
            path: path.resolve(root, '.kubb/client.ts'),
            copy: resolvedClientDescriptor.client === 'fetch' ? fetchClientTemplatePath : axiosClientTemplatePath,
            footer: baseURL ? `client.setConfig({ baseURL: ${JSON.stringify(baseURL)} })` : undefined,
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
