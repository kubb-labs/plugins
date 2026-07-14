import { createGroupConfig } from '@internals/shared'
import { pluginEffectName } from '@kubb/plugin-effect'
import { definePlugin, Resolver } from 'kubb/kit'
import { httpApiClientGenerator } from './generators/httpApiClientGenerator.tsx'
import { resolverEffectHttpApiClient } from './resolvers/resolverEffectHttpApiClient.ts'
import type { PluginEffectHttpApiClient } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-effect-httpapiclient`.
 */
export const pluginEffectHttpApiClientName = 'plugin-effect-httpapiclient' satisfies PluginEffectHttpApiClient['name']

/**
 * Generates Effect v4 HttpApi contracts and a fixed HttpApiClient Effect from OpenAPI.
 *
 * @example
 * ```ts
 * import { pluginEffect } from '@kubb/plugin-effect'
 * import { pluginEffectHttpApiClient } from '@kubb/plugin-effect-httpapiclient'
 * import { defineConfig } from 'kubb/config'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [pluginEffect(), pluginEffectHttpApiClient({ baseURL: 'https://petstore.example.com' })],
 * })
 * ```
 *
 * @beta
 */
export const pluginEffectHttpApiClient = definePlugin<PluginEffectHttpApiClient>((options) => {
  const {
    output = { path: 'effectHttpApiClient', barrel: { type: 'named' } },
    group,
    baseURL,
    mode = 'tag',
    exclude = [],
    include,
    override = [],
    resolver: userResolver,
    macros,
  } = options

  return {
    name: pluginEffectHttpApiClientName,
    options,
    dependencies: [pluginEffectName],
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({
          output,
          exclude,
          include,
          override,
          group: createGroupConfig(group),
          baseURL,
          mode,
        })
        ctx.setResolver(userResolver ? Resolver.merge(resolverEffectHttpApiClient, userResolver) : resolverEffectHttpApiClient)
        if (macros?.length) ctx.setMacros(macros)
        ctx.addGenerator(httpApiClientGenerator)
      },
    },
  }
})

export default pluginEffectHttpApiClient
