import { createRequire } from 'node:module'
import path from 'node:path'
import { addMacro, addTemplate, defineExtension, Diagnostics, Resolver, setResolver, useConfig } from '@kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { createClientTemplates } from './templates/client.tsx'
import { defaultMacros } from './macros.ts'
import { resolverClient } from './resolver.ts'
import { clientDependencies, setupClient } from './setup.ts'
import type { PluginClient, ResolvedOptions, ResolverClient } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-client`.
 */
export const pluginClientName = 'plugin-client' satisfies PluginClient['name']

/**
 * Resolves the `client.ts` template of the transport package from the project, so plugin-client needs no dependency on it.
 */
function resolveRuntime(runtime: NonNullable<PluginClient['options']['runtime']>): string {
  const packageName = `@kubb/plugin-${runtime}`
  const require = createRequire(path.resolve(useConfig().root, 'package.json'))
  try {
    return require.resolve(`${packageName}/templates/client.ts`)
  } catch {
    throw new Diagnostics.Error({
      code: Diagnostics.code.missingDependency,
      severity: 'error',
      message: `Plugin "${pluginClientName}" has \`runtime: '${runtime}'\` but cannot find "${packageName}".`,
      help: `Install "${packageName}", which ships the ${runtime} runtime.`,
      location: { kind: 'config' },
      plugin: pluginClientName,
    })
  }
}

/**
 * Generates typed operations that call a client module owned by your application.
 * The module at `importPath` must export the runtime helpers and types used by generated operations.
 * Kubb writes no transport runtime unless `runtime` names a transport.
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
    const resolved: ResolvedOptions = {
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

    if (options.runtime) {
      setupClient({ resolved, macros: options.macros, client: resolveRuntime(options.runtime) })
      return resolved
    }

    setResolver(resolver)
    addMacro(...defaultMacros, ...(options.macros ?? []))
    for (const template of createClientTemplates<PluginClient>()) {
      addTemplate(template)
    }

    return resolved
  },
})

export default pluginClient
