import path from 'node:path'
import type { AdapterOas } from '@kubb/adapter-oas'
import { adapterOasName } from '@kubb/adapter-oas'

import { type Adapter, ast, defineExtension, Diagnostics, injectFile, useConfig } from '@kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { getPageHTML } from './redoc.ts'
import type { PluginRedoc } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-redoc`. Used for driver lookups and
 * cross-plugin dependency references.
 */
export const pluginRedocName = 'plugin-redoc' satisfies PluginRedoc['name']

/**
 * Generates a self-contained static HTML documentation page from your OpenAPI
 * spec using Redoc. The file is regenerated on every Kubb build, so the docs
 * stay in lockstep with the spec the rest of your code is generated from.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginRedoc } from '@kubb/plugin-redoc'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginRedoc({ output: { path: 'docs.html' } }),
 *   ],
 * })
 * ```
 */
export const pluginRedoc = defineExtension<PluginRedoc>({
  kind: 'plugin',
  meta: { name: pluginRedocName, version, compatibility },
  async setup(options) {
    const config = useConfig()
    const { output = { path: 'docs.html' } } = options

    const adapter = config.adapter

    if (adapter?.name !== adapterOasName) {
      throw new Diagnostics.Error({
        code: Diagnostics.code.adapterRequired,
        severity: 'error',
        message: `Plugin "${pluginRedocName}" requires the OpenAPI adapter, but the config uses ${adapter ? `"${adapter.name}"` : 'no adapter'}.`,
        help: 'Set `adapter: adapterOas()` in kubb.config.ts.',
        location: { kind: 'config' },
        plugin: pluginRedocName,
      })
    }

    const document = (adapter as Adapter<AdapterOas>).document

    if (!document) {
      throw new Diagnostics.Error({
        code: Diagnostics.code.pluginFailed,
        severity: 'error',
        message: `No OpenAPI document found. \`adapterOas\` did not produce a document before ${pluginRedocName} ran.`,
        plugin: pluginRedocName,
      })
    }

    const pageHTML = getPageHTML(document)

    injectFile({
      baseName: 'docs.html',
      path: path.resolve(config.root, config.output.path, output.path || './docs.html'),
      sources: [
        ast.factory.createSource({
          name: 'docs.html',
          nodes: [ast.factory.createText(pageHTML)],
        }),
      ],
    })

    return { output }
  },
})

export default pluginRedoc
