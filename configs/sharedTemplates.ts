import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Rolldown } from 'tsdown'

const clientTemplates = fileURLToPath(new URL('../packages/plugin-client/templates/', import.meta.url))

function createPlugin(): Rolldown.Plugin {
  let client: string | undefined

  return {
    name: 'shared-templates',
    resolveId: {
      order: 'pre',
      async handler(source, importer) {
        const shared = /^\.\/(serializers|standardSchema)\.ts$/.exec(source)
        if (shared) return { id: `@kubb/plugin-client/templates/${shared[1]}.ts`, external: true }
        if (!importer) return null

        const isDts = importer.endsWith('.d.ts')
        const fromShared = importer.startsWith(clientTemplates)

        if (!fromShared && source === './core.ts') {
          client = importer.replace(/\.d\.ts$|\.ts$/, '')
          const core = path.join(clientTemplates, 'core.ts')
          if (!isDts) return core
          await this.load({ id: core })
          return { id: path.join(clientTemplates, 'core.d.ts') }
        }
        if (fromShared && source === './client.ts' && client) return `${client}${isDts ? '.d.ts' : '.ts'}`

        return null
      },
    },
  }
}

/**
 * Bundles plugin-client's `core.ts` into a transport's `client.d.ts` with `./client.ts` pointing back at the transport, so the types use its `NativeOptions`.
 * The plugin goes first so it resolves `./core.ts` before the dts resolver maps it to the stub next to the template.
 */
export function sharedTemplates(options: Rolldown.InputOptions): Rolldown.InputOptions {
  return { ...options, plugins: [createPlugin(), options.plugins] }
}
