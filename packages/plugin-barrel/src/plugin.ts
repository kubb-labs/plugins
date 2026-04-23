import type { ast} from '@kubb/core';
import { definePlugin, type KubbBuildStartContext, type NormalizedPlugin } from '@kubb/core'
import type { PluginBarrel, PluginBarrelOptions } from './types.ts'
import { generatePerPluginBarrel, generateRootBarrel } from './utils.ts'

export const pluginBarrelName = 'plugin-barrel' satisfies PluginBarrel['name']

/**
 * Extended build-start context that includes the live file list and upsert helper.
 * These properties are added to `KubbBuildStartContext` by the core PR that introduces
 * `plugin-barrel`; the type cast below bridges the current published API until those
 * changes are released.
 *
 * @internal
 */
type BuildStartContextWithFiles = KubbBuildStartContext & {
  files: ReadonlyArray<ast.FileNode>
  upsertFile: (...files: Array<ast.FileNode>) => void
}

/**
 * Barrel-file generation plugin.
 *
 * Owns all barrel generation logic — core has zero awareness of this plugin.
 * Automatically runs after all other plugins regardless of its position in the
 * plugins array (via `enforce: 'post'`), so that every other plugin has already
 * deposited its files into the file manager before the root barrel is generated.
 *
 * - `kubb:plugin:setup`: persists the resolved options.
 * - `kubb:build:start`: captures the build context for later use during `kubb:plugin:end`.
 * - `kubb:plugin:end`:
 *   - For every other plugin: generates the per-plugin `index.ts` inside that
 *     plugin's output directory (respecting `options.plugins` overrides and the
 *     plugin's own `output.barrelType`).
 *   - For `plugin-barrel` itself: generates the root `index.ts` that re-exports
 *     from all indexable sources across every plugin.
 *
 * @example
 * ```ts
 * import { pluginBarrel } from '@kubb/plugin-barrel'
 *
 * export default defineConfig({
 *   plugins: [
 *     pluginTs(),
 *     pluginBarrel({
 *       root: { barrelType: 'named' },
 *       plugins: [
 *         { name: 'plugin-ts',  barrelType: 'named' },
 *         { name: 'plugin-zod', barrelType: 'all'   },
 *       ],
 *     }),
 *     pluginZod(),
 *   ],
 * })
 * ```
 */
export const pluginBarrel = definePlugin<PluginBarrel>((options: PluginBarrelOptions = {}) => {
  let ctx: BuildStartContextWithFiles | undefined

  return {
    name: pluginBarrelName,
    enforce: 'post',
    options,
    hooks: {
      'kubb:plugin:setup'(c) {
        c.setOptions(options)
      },

      'kubb:build:start'(c) {
        ctx = c as BuildStartContextWithFiles
      },

      async 'kubb:plugin:end'({ plugin, success }) {
        if (!success || !ctx) return

        const buildConfig = ctx.config
        const files = ctx.files
        const getPlugin = (name: string) => ctx!.getPlugin(name) as NormalizedPlugin | undefined
        const upsertFile = ctx.upsertFile

        if (plugin.name === pluginBarrelName) {
          await generateRootBarrel(options, files, buildConfig, getPlugin, upsertFile)
          return
        }

        await generatePerPluginBarrel(plugin.name, options, files, buildConfig, getPlugin, upsertFile)
      },
    },
  }
})

export default pluginBarrel
