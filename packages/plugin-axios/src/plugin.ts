import { fileURLToPath } from 'node:url'
import { defineExtension } from '@kubb/kit'
import { clientDependencies, resolveClientOptions, setupClient } from '@kubb/plugin-client'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
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
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginAxios } from '@kubb/plugin-axios'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginAxios({ output: { path: './clients' } }),
 *   ],
 * })
 * ```
 */
export const pluginAxios = defineExtension<PluginAxios>({
  kind: 'plugin',
  meta: { name: pluginAxiosName, version, compatibility },
  dependencies: clientDependencies,
  setup(options) {
    const resolved = resolveClientOptions(options)
    setupClient({ name: 'axios', resolved, macros: options.macros, client: fileURLToPath(new URL('../templates/client.ts', import.meta.url)) })
    return resolved
  },
})

export default pluginAxios
