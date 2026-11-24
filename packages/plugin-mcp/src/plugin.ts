import { resolveContractClient } from '@internals/client'
import { addMacro, addTemplate, defineExtension, Resolver, setResolver, useConfig } from '@kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { mcpOperation } from './templates/mcp.tsx'
import { serverOperations } from './templates/server.tsx'
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
 * client `<op>` from a registered client plugin: `@kubb/plugin-fetch`, `@kubb/plugin-axios`, `@kubb/plugin-ky` or `@kubb/plugin-client`.
 * Next to the handlers it writes `server.ts`, a `start.ts` entry that serves the
 * tools over stdio, and a `.mcp.json` that runs `start.ts` with `tsx`.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginZod } from '@kubb/plugin-zod'
 * import { pluginFetch } from '@kubb/plugin-fetch'
 * import { pluginMcp } from '@kubb/plugin-mcp'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginZod(),
 *     pluginFetch({ baseURL: 'https://petstore.swagger.io/v2' }),
 *     pluginMcp({ output: { path: 'mcp' } }),
 *   ],
 * })
 * ```
 */
export const pluginMcp = defineExtension<PluginMcp>({
  kind: 'plugin',
  meta: { name: pluginMcpName, version, compatibility },
  dependencies: { [pluginTsName]: { optional: true }, [pluginZodName]: {} },
  setup(options) {
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

    const resolver = userResolver ? Resolver.merge<ResolverMcp>(resolverMcp, ...[userResolver].flat()) : resolverMcp

    setResolver(resolver)
    addMacro(...(userMacros ?? []))
    addTemplate(mcpOperation)
    addTemplate(serverOperations)

    return {
      output,
      exclude,
      include,
      override,
      group: group ?? null,
      client: resolveContractClient({ plugin: pluginMcpName, client, plugins: useConfig().plugins }),
      resolver,
    }
  },
})

export default pluginMcp
