import { addMacro, addTemplate, defineExtension, Resolver, setResolver } from '@kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { createClientTemplates } from './templates/client.tsx'
import { defaultMacros } from './macros.ts'
import { resolverClient } from './resolver.ts'
import { clientDependencies } from './setup.ts'
import type { PluginClient, ResolverClient } from './types.ts'

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
    const {
      output = { path: 'clients', barrel: { type: 'named' } },
      exclude = [],
      include,
      override = [],
      importPath,
      throwOnErrorDefault = true,
      validator = false,
      auth,
      returnType = 'plain',
      group,
      resolver: userResolver,
    } = options

    const resolver = userResolver ? Resolver.merge<ResolverClient>(resolverClient, ...[userResolver].flat()) : resolverClient

    setResolver(resolver)
    addMacro(...defaultMacros, ...(options.macros ?? []))
    for (const template of createClientTemplates<PluginClient>()) {
      addTemplate(template)
    }

    return {
      output,
      exclude,
      include,
      override,
      group: group ?? null,
      importPath,
      baseURL: undefined,
      throwOnErrorDefault,
      validator,
      auth: { mode: auth?.mode ?? 'optional' },
      returnType,
      sdk: undefined,
      resolver,
    }
  },
})

export default pluginClient
