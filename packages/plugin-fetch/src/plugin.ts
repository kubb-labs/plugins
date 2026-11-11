import { fileURLToPath } from 'node:url'
import { defineExtension } from '@kubb/kit'
import { clientDependencies, resolveClientOptions, setupClient } from '@kubb/plugin-client'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
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
 * from `@kubb/plugin-fetch` and the only runtime dependency is the global `fetch`. Set `importPath` to
 * make the operations import a module of your own that wraps that runtime.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginFetch } from '@kubb/plugin-fetch'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginFetch({ output: { path: './clients' } }),
 *   ],
 * })
 * ```
 */
export const pluginFetch = defineExtension<PluginFetch>({
  kind: 'plugin',
  meta: { name: pluginFetchName, version, compatibility },
  dependencies: clientDependencies,
  setup(options) {
    const resolved = { ...resolveClientOptions(options), importPath: options.importPath }
    setupClient({ name: 'fetch', resolved, macros: options.macros, client: fileURLToPath(new URL('../templates/client.ts', import.meta.url)) })
    return resolved
  },
})

export default pluginFetch
