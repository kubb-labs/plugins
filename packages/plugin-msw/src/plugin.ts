import { createGroupConfig } from '@internals/shared'
import { addGenerator, defineExtension, Resolver, setMacros, setResolver } from '@kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { pluginFakerName } from '@kubb/plugin-faker'
import { pluginTsName } from '@kubb/plugin-ts'
import { handlersGenerator } from './generators/handlersGenerator.ts'
import { mswGenerator } from './generators/mswGenerator.tsx'
import { resolverMsw } from './resolvers/resolverMsw.ts'
import type { PluginMsw, ResolverMsw } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-msw`. Used for driver lookups and
 * cross-plugin dependency references.
 */
export const pluginMswName = 'plugin-msw' satisfies PluginMsw['name']

/**
 * Generates MSW request handlers from an OpenAPI spec. Drop them into your
 * test setup or service worker to mock the API end-to-end. Request path,
 * method, status, and response body all stay in sync with the spec. Combine
 * with `@kubb/plugin-faker` (via `parser: 'faker'`) to seed handlers with
 * realistic data.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginMsw } from '@kubb/plugin-msw'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginMsw({
 *       output: { path: './handlers' },
 *       handlers: true,
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginMsw = defineExtension<PluginMsw>({
  kind: 'plugin',
  meta: { name: pluginMswName, version, compatibility },
  dependencies: (options) => ({ [pluginTsName]: {}, ...(options.parser === 'faker' ? { [pluginFakerName]: {} } : {}) }),
  setup(options) {
    const {
      output = { path: 'handlers', barrel: { type: 'named' } },
      group,
      exclude = [],
      include,
      override = [],
      handlers = false,
      parser = 'data',
      baseURL,
      resolver: userResolver,
      macros: userMacros,
    } = options

    const resolver = userResolver ? Resolver.merge<ResolverMsw>(resolverMsw, userResolver) : resolverMsw

    setResolver(resolver)
    if (userMacros?.length) {
      setMacros(userMacros)
    }

    addGenerator(mswGenerator)
    if (handlers) {
      addGenerator(handlersGenerator)
    }

    return {
      output,
      parser,
      baseURL,
      group: createGroupConfig(group),
      exclude,
      include,
      override,
      handlers,
    }
  },
})

export default pluginMsw
