import { createGroupConfig } from '@internals/shared'
import { definePlugin, Resolver } from 'kubb/kit'
import { effectGenerator } from './generators/effectGenerator.tsx'
import { resolverEffect } from './resolvers/resolverEffect.ts'
import type { PluginEffect } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-effect`.
 */
export const pluginEffectName = 'plugin-effect' satisfies PluginEffect['name']

/**
 * Generates Effect v4 schemas and matching TypeScript types from OpenAPI.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginEffect } from '@kubb/plugin-effect'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [pluginEffect()],
 * })
 * ```
 *
 * @beta
 */
export const pluginEffect = definePlugin<PluginEffect>((options) => {
  const {
    output = { path: 'effect', barrel: { type: 'named' } },
    group,
    exclude = [],
    include,
    override = [],
    importPath = 'effect/Schema',
    regexType = 'constructor',
    printer,
    resolver: userResolver,
    macros: userMacros,
  } = options

  return {
    name: pluginEffectName,
    options,
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({
          output,
          exclude,
          include,
          override,
          group: createGroupConfig(group),
          importPath,
          regexType,
          printer,
        })
        ctx.setResolver(userResolver ? Resolver.merge(resolverEffect, userResolver) : resolverEffect)
        if (userMacros?.length) ctx.setMacros(userMacros)
        ctx.addGenerator(effectGenerator)
      },
    },
  }
})

export default pluginEffect
