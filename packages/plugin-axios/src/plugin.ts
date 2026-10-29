import { createContractClientPlugin } from '@internals/client'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { clientGenerator } from './generators/clientGenerator.tsx'
import { axiosClientTemplatePath, axiosSerializersTemplatePath, standardSchemaTemplatePath } from './templates.ts'
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
export const pluginAxios = createContractClientPlugin<PluginAxios>({
  meta: { name: pluginAxiosName, version, compatibility },
  clientGenerator,
  templates: { client: axiosClientTemplatePath, serializers: axiosSerializersTemplatePath, standardSchema: standardSchemaTemplatePath },
})

export default pluginAxios
