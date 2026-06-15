import path from 'node:path'
import { ast } from '@kubb/core'
import type { KubbPluginSetupContext } from '@kubb/core'
import { source as runtimeSource } from '../templates/runtime.source.ts'

/**
 * The shared runtime source, inlined as a string at build time. Each slim plugin embeds this into
 * its generated `.kubb/client.ts` and appends a transport prelude.
 */
export { runtimeSource }

/**
 * The per-plugin half of the runtime. `source` is appended after the shared runtime and must define
 * `defaultTransport`, then export the default `client` and a `createClient` factory built from it.
 */
export type TransportDescriptor = {
  /**
   * Source spliced in after the shared runtime. Defines `defaultTransport` and exports
   * `client` / `createClient`.
   */
  source: string
  /**
   * Import lines the transport prelude needs at the top of the generated file (e.g.
   * `import axios from 'axios'`).
   */
  imports?: Array<string>
}

export type InjectClientRuntimeParams = {
  /**
   * The plugin setup context's `injectFile`. Passed in rather than the whole context so this stays
   * pure and unit-testable.
   */
  injectFile: KubbPluginSetupContext['injectFile']
  /**
   * Absolute path of the plugin's output root. The runtime is written to `<root>/.kubb/client.ts`.
   */
  root: string
  transport: TransportDescriptor
}

/**
 * Assembles the final `.kubb/client.ts` body: the transport's imports, then the shared runtime, then
 * the transport prelude.
 */
export function composeClientRuntime(transport: TransportDescriptor): string {
  const imports = transport.imports?.length ? `${transport.imports.join('\n')}\n\n` : ''
  return `${imports}${runtimeSource}\n${transport.source}\n`
}

/**
 * Injects the composed runtime into the generated output as `.kubb/client.ts`. This is the
 * always-on bundle path — the slim plugins have no `bundle` option, the runtime is always embedded.
 */
export function injectClientRuntime({ injectFile, root, transport }: InjectClientRuntimeParams): void {
  injectFile({
    baseName: 'client.ts',
    path: path.resolve(root, '.kubb/client.ts'),
    sources: [
      ast.factory.createSource({
        name: 'client',
        nodes: [ast.factory.createText(composeClientRuntime(transport))],
        isExportable: true,
        isIndexable: true,
      }),
    ],
  })
}
