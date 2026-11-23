import { fileURLToPath } from 'node:url'
import { defineExtension } from '@kubb/kit'
import { clientDependencies, resolveClientOptions, setupClient } from '@kubb/plugin-client'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import type { PluginKy } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-ky`. Used for driver lookups and cross-plugin
 * dependency references.
 */
export const pluginKyName = 'plugin-ky' satisfies PluginKy['name']

/**
 * Generates a type-safe HTTP client pinned to Ky. Each operation becomes one async function
 * that takes a single grouped `options` object and returns the shared `RequestResult` contract. The
 * runtime is always bundled into `.kubb/client.ts`, so generated code never imports from
 * `@kubb/plugin-ky` and the only runtime dependency is `ky`.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginKy } from '@kubb/plugin-ky'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginKy({ output: { path: './clients' } }),
 *   ],
 * })
 * ```
 */
export const pluginKy = defineExtension<PluginKy>({
  kind: 'plugin',
  meta: { name: pluginKyName, version, compatibility },
  dependencies: clientDependencies,
  setup(options) {
    const resolved = resolveClientOptions(options)
    setupClient({ resolved, macros: options.macros, client: fileURLToPath(new URL('../templates/client.ts', import.meta.url)) })
    return resolved
  },
})

export default pluginKy
