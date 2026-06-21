import path from 'node:path'
import { defaultMacros, isParserEnabled, resolveOptions } from '@internals/client'
import { definePlugin } from '@kubb/core'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { clientGenerator } from './generators/clientGenerator.tsx'
import { axiosClientTemplatePath } from './templates.ts'
import type { PluginAxios } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-axios`. Used for driver lookups and cross-plugin
 * dependency references.
 */
export const pluginAxiosName = 'plugin-axios' satisfies PluginAxios['name']

/**
 * Generates a type-safe HTTP client pinned to axios. Each operation becomes one async function
 * that takes a single grouped `options` object and returns the shared `RequestResult` contract. The
 * runtime is always bundled into `.kubb/client.ts`, so generated code never imports from
 * `@kubb/plugin-axios` and the only runtime dependency is `axios`.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginAxios } from '@kubb/plugin-axios'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginAxios({ output: { path: './clients' } }),
 *   ],
 * })
 * ```
 */
export const pluginAxios = definePlugin<PluginAxios>((options) => {
  const resolved = resolveOptions(options)
  const { baseURL } = resolved
  const selectedGenerators = [clientGenerator]

  return {
    name: pluginAxiosName,
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
          copy: axiosClientTemplatePath,
          footer: baseURL ? `client.setConfig({ baseURL: ${JSON.stringify(baseURL)} })` : undefined,
        })
      },
    },
  }
})

export default pluginAxios
