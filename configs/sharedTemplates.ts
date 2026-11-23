import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Rolldown } from 'tsdown'

const clientTemplates = fileURLToPath(new URL('../packages/plugin-client/templates/', import.meta.url))

function createPlugin(): Rolldown.Plugin {
  // The transport's `client` template, without its extension, recorded when it imports `./core.ts`.
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
          // Same steps as the dts resolver: load the source so its declaration is generated, then point at the declaration.
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
 * `inputOptions` for the declaration build of the client templates of `@kubb/plugin-fetch`, `@kubb/plugin-axios`, and `@kubb/plugin-ky`.
 * It bundles the shared `core.ts` and `mediaTypes.ts` from `@kubb/plugin-client` into the transport's `client.d.ts`, with their
 * `./client.ts` import pointing back at the transport's template, so the types use its `NativeOptions` like the generated `.kubb/`
 * folder does. The serializers and Standard Schema helpers do not depend on the transport, so they stay imports of `@kubb/plugin-client`.
 * The plugin goes first so it resolves `./core.ts` before the dts resolver maps it to the stub next to the template.
 */
export function sharedTemplates(options: Rolldown.InputOptions): Rolldown.InputOptions {
  return { ...options, plugins: [createPlugin(), options.plugins] }
}
