import { createContractClientPlugin } from '@internals/client'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { clientGenerator } from './generators/clientGenerator.tsx'
import { fetchClientTemplatePath, fetchSerializersTemplatePath, standardSchemaTemplatePath } from './templates.ts'
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
export const pluginFetch = createContractClientPlugin<PluginFetch>({
  meta: { name: pluginFetchName, version, compatibility },
  clientGenerator,
  templates: { client: fetchClientTemplatePath, serializers: fetchSerializersTemplatePath, standardSchema: standardSchemaTemplatePath },
})

export default pluginFetch
