import path from 'node:path'
import { createSdkGenerator, defaultMacros, isParserEnabled, resolverClient } from '@internals/client'
import { createGroupConfig } from '@internals/shared'
import { definePlugin } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { clientGenerator } from './generators/clientGenerator.tsx'
import { fetchClientTemplatePath, standardSchemaTemplatePath } from './templates.ts'
import type { PluginFetch, ResolvedOptions } from './types.ts'

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
  const {
    output = { path: 'clients', barrel: { type: 'named' } },
    exclude = [],
    include,
    override = [],
    baseURL,
    parser = false,
    group,
    sdk,
    resolver: userResolver,
  } = options

  const resolved: ResolvedOptions = {
    output,
    exclude,
    include,
    override,
    group: createGroupConfig(group),
    baseURL,
    parser,
    sdk: sdk ? { mode: sdk.mode ?? 'tag', name: sdk.name } : undefined,
    resolver: userResolver ? { ...resolverClient, ...userResolver } : resolverClient,
  }

  // `sdk` swaps the per-operation functions for the class-based SDK; left unset, the standalone
  // functions (which query plugins consume) stay.
  const selectedGenerators = resolved.sdk ? [createSdkGenerator<PluginFetch>()] : [clientGenerator]

  return {
    name: pluginFetchName,
    options,
    dependencies: [pluginTsName, isParserEnabled(resolved.parser) ? pluginZodName : null].filter((dependency): dependency is string => Boolean(dependency)),
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions(resolved)
        ctx.setResolver(resolved.resolver)
        ctx.setMacros([...defaultMacros, ...(options.macros ?? [])])

        ctx.addGenerator(...selectedGenerators)

        const root = path.resolve(ctx.config.root, ctx.config.output.path)

        ctx.injectFile({
          baseName: 'client.ts',
          path: path.resolve(root, '.kubb/client.ts'),
          copy: fetchClientTemplatePath,
          footer: baseURL ? `client.setConfig({ baseURL: ${JSON.stringify(baseURL)} })` : undefined,
        })

        if (isParserEnabled(resolved.parser)) {
          ctx.injectFile({
            baseName: 'standard-schema.ts',
            path: path.resolve(root, '.kubb/standard-schema.ts'),
            copy: standardSchemaTemplatePath,
          })
        }
      },
    },
  }
})

export default pluginFetch
