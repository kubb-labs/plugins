import path from 'node:path'
import { createSdkGenerator, defaultMacros, isParserEnabled, resolveOptions } from '@internals/client'
import { definePlugin } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { clientGenerator } from './generators/clientGenerator.tsx'
import { fetchClientTemplatePath } from './templates.ts'
import type { PluginFetch } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-fetch`. Used for driver lookups and cross-plugin
 * dependency references.
 */
export const pluginFetchName = 'plugin-fetch' satisfies PluginFetch['name']

/**
 * Generates a type-safe HTTP client pinned to the Fetch API. Each operation becomes one async
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

  // `class` swaps the per-operation functions for one static class per tag. `function` keeps the
  // functions and, when an `sdk.name` is set, adds the `export * as` aggregation entry point.
  const selectedGenerators =
    resolved.sdk.shape === 'class' ? [createSdkGenerator<PluginFetch>()] : [clientGenerator, ...(resolved.sdk.name ? [createSdkGenerator<PluginFetch>()] : [])]

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

        ctx.injectFile({
          baseName: 'client.ts',
          path: path.resolve(root, '.kubb/client.ts'),
          copy: fetchClientTemplatePath,
          footer: baseURL ? `client.setConfig({ baseURL: ${JSON.stringify(baseURL)} })` : undefined,
        })
      },
    },
  }
})

export default pluginFetch
