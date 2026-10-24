import { createGroupConfig } from '@internals/shared'

import { resolveContractClient } from '@internals/client'
import { addGenerator, defineExtension, Resolver, setMacros, setResolver, useConfig } from 'kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
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
  // `plugin-ts` is optional: `pluginZod({ inferred })` can supply the handler types instead.
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

    const resolver = userResolver ? Resolver.merge<ResolverMcp>(resolverMcp, userResolver) : resolverMcp

    setResolver(resolver)
    if (userMacros?.length) {
      setMacros(userMacros)
    }
    addGenerator(mcpGenerator, serverGenerator)

    return {
      output,
      exclude,
      include,
      override,
      group: createGroupConfig(group),
      client: resolveContractClient({ plugin: pluginMcpName, client, plugins: useConfig().plugins }),
      resolver,
    }
  },
})

export default pluginMcp
