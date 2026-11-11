import { addGenerator, defineExtension, Resolver, setMacros, setResolver } from '@kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { createClientGenerator } from './generators/clientGenerator.tsx'
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
      group,
      resolver: userResolver,
    } = options

    const resolver = userResolver ? Resolver.merge<ResolverClient>(resolverClient, userResolver) : resolverClient

    setResolver(resolver)
    setMacros([...defaultMacros, ...(options.macros ?? [])])
    addGenerator(createClientGenerator<PluginClient>('client'))

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
      returnType: 'plain',
      sdk: undefined,
      resolver,
    }
  },
})

export default pluginClient
