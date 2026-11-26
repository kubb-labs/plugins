import { addMacro, addTemplate, defineExtension, Diagnostics, injectFile, Resolver, setResolver, useConfig } from '@kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { pluginFakerName } from '@kubb/plugin-faker'
import { pluginTsName } from '@kubb/plugin-ts'
import { handlersOperations } from './templates/handlers.ts'
import { mswOperation } from './templates/msw.tsx'
import { resolverMsw } from './resolvers/resolverMsw.ts'
import { mswBodyPath, mswBodyTemplate } from './utils.ts'
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
      mediaTypes = {},
      resolver: userResolver,
      macros: userMacros,
    } = options

    // An encoder is called by its export name, so that name has to be free in every handler file.
    const reserved = new Map(['data', 'info', 'options', 'handler', 'http', 'HttpResponse'].map((name) => [name, 'the generated handler']))
    for (const { name, path } of Object.values(mediaTypes)) {
      const taken = reserved.get(name)
      if (taken && taken !== path) {
        throw new Diagnostics.Error({
          code: Diagnostics.code.invalidPluginOptions,
          severity: 'error',
          message: `Plugin "${pluginMswName}" cannot use the \`mediaTypes\` encoder "${name}" from "${path}", because ${taken === 'the generated handler' ? taken : `"${taken}"`} already uses that name.`,
          help: 'Export the encoder under another name.',
          location: { kind: 'config' },
          plugin: pluginMswName,
        })
      }
      reserved.set(name, path)
    }

    const resolver = userResolver ? Resolver.merge<ResolverMsw>(resolverMsw, ...[userResolver].flat()) : resolverMsw

    setResolver(resolver)
    addMacro(...(userMacros ?? []))

    addTemplate(mswOperation)
    injectFile({ baseName: 'mswBody.ts', path: mswBodyPath(useConfig()), copy: mswBodyTemplate })
    if (handlers) {
      addTemplate(handlersOperations)
    }

    return {
      output,
      parser,
      baseURL,
      group: group ?? null,
      exclude,
      include,
      override,
      handlers,
      mediaTypes,
    }
  },
})

export default pluginMsw
