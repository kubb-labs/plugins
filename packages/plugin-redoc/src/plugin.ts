import path from 'node:path'
import type { AdapterOas } from '@kubb/adapter-oas'
import { adapterOasName } from '@kubb/adapter-oas'

import { type Adapter, ast, definePlugin } from '@kubb/core'
import { version } from '../package.json'
import { getPageHTML } from './redoc.tsx'
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
 * import { defineConfig } from 'kubb'
 * import { pluginRedoc } from '@kubb/plugin-redoc'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginRedoc({ output: { path: 'docs.html' } }),
 *   ],
 * })
 * ```
 */
export const pluginRedoc = definePlugin<PluginRedoc>((options) => {
  const { output = { path: 'docs.html' } } = options
  const extname = path.extname(output.path)
  const name = extname ? output.path.slice(0, -extname.length) : output.path

  return {
    name: pluginRedocName,
    version,
    options,
    hooks: {
      async 'kubb:plugin:setup'(ctx) {
        ctx.setOptions({
          output,
          name,
          exclude: [],
          override: [],
        })

        const adapter = ctx.config.adapter

        if (adapter?.name !== adapterOasName) {
          throw new Error(
            `[${pluginRedocName}] plugin-redoc requires the OpenAPI adapter. Make sure you are using adapterOas (e.g. \`adapter: adapterOas()\`) in your Kubb config.`,
          )
        }

        const document = (adapter as Adapter<AdapterOas>).document

        if (!document) {
          throw new Error(
            `[${pluginRedocName}] No OpenAPI document found. The adapterOas did not produce a document — ensure the adapter has run before this plugin.`,
          )
        }

        const root = path.resolve(ctx.config.root, ctx.config.output.path)
        const pageHTML = await getPageHTML(document)

        ctx.injectFile({
          baseName: 'docs.html',
          path: path.resolve(root, output.path || './docs.html'),
          sources: [
            ast.createSource({
              name: 'docs.html',
              nodes: [ast.createText(pageHTML)],
            }),
          ],
        })
      },
    },
  }
})

export default pluginRedoc
