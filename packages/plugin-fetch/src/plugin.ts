import path from 'node:path'
import { defaultMacros, injectClientRuntime, isParserEnabled, resolveOptions } from '@internals/client'
import { definePlugin } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { source as fetchTransportSource } from './clients/fetch.source.ts'
import { clientGenerator } from './generators/clientGenerator.tsx'
import type { PluginFetch } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-fetch`. Used for driver lookups and cross-plugin
 * dependency references.
 */
export const pluginFetchName = 'plugin-fetch' satisfies PluginFetch['name']

/**
 * Generates a slim, type-safe HTTP client pinned to the Fetch API. Each operation becomes one async
 * function that takes a single grouped `options` object and returns the shared `RequestResult`
 * contract. The runtime is always bundled into `.kubb/client.ts`, so generated code never imports
 * from `@kubb/plugin-fetch` and the only runtime dependency is the global `fetch`.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginFetch } from '@kubb/plugin-fetch'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginFetch({ output: { path: './clients' } }),
 *   ],
 * })
 * ```
 */
export const pluginFetch = definePlugin<PluginFetch>((options) => {
  const resolved = resolveOptions(options)
  const { baseURL } = resolved
  const selectedGenerators = options.generators ?? [clientGenerator]

  return {
    name: pluginFetchName,
    options,
    dependencies: [pluginTsName, isParserEnabled(resolved.parser) ? pluginZodName : null].filter((dependency): dependency is string => Boolean(dependency)),
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions(resolved)
        ctx.setResolver(resolved.resolver)
        ctx.setMacros([...defaultMacros, ...(options.macros ?? [])])

        for (const gen of selectedGenerators) {
          ctx.addGenerator(gen)
        }

        const root = path.resolve(ctx.config.root, ctx.config.output.path)
        const source = baseURL ? `${fetchTransportSource}\nclient.setConfig({ baseURL: ${JSON.stringify(baseURL)} })\n` : fetchTransportSource

        injectClientRuntime({ injectFile: ctx.injectFile, root, transport: { source } })
      },
    },
  }
})

export default pluginFetch
