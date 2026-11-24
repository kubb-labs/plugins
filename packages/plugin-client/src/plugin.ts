import { addMacro, addTemplate, defineExtension, setResolver } from '@kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { createClientTemplates } from './templates/client.tsx'
import { defaultMacros } from './macros.ts'
import { clientDependencies, resolveClientOptions } from './setup.ts'
import type { PluginClient } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-client`.
 */
export const pluginClientName = 'plugin-client' satisfies PluginClient['name']

/**
 * Generates typed operations that call a client module owned by your application.
 * The module at `importPath` must export the runtime helpers and types used by generated operations.
 * Kubb does not copy or inject a transport implementation.
 *
 * @example
 * ```ts
 * pluginClient({ importPath: '../api/client' })
 * ```
 */
export const pluginClient = defineExtension<PluginClient>({
  kind: 'plugin',
  meta: { name: pluginClientName, version, compatibility },
  dependencies: clientDependencies,
  setup(options) {
    // The shared defaults, except that a client module the application owns returns the body by default.
    const resolved = resolveClientOptions({ ...options, returnType: options.returnType ?? 'plain' })

    setResolver(resolved.resolver)
    addMacro(...defaultMacros, ...(options.macros ?? []))
    for (const template of createClientTemplates<PluginClient>()) {
      addTemplate(template)
    }

    return { ...resolved, importPath: options.importPath }
  },
})

export default pluginClient
