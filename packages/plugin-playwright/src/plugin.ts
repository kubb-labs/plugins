import { pluginTsName } from '@kubb/plugin-ts'
import { definePlugin } from 'kubb/kit'
import { playwrightGenerator } from './generators/playwrightGenerator.tsx'
import { resolverPlaywright } from './resolvers/resolverPlaywright.ts'
import type { PluginPlaywright } from './types.ts'

/**
 * Identifies the Playwright plugin in the Kubb driver.
 */
export const pluginPlaywrightName = 'plugin-playwright' satisfies PluginPlaywright['name']

/**
 * Generates native Playwright responses for GET operations without parameters or a request body.
 * Other operations are skipped. Requires `pluginTs()` for the response types.
 */
export const pluginPlaywright = definePlugin<PluginPlaywright>((options) => ({
  name: pluginPlaywrightName,
  options,
  dependencies: [pluginTsName],
  hooks: {
    'kubb:plugin:setup'(ctx) {
      ctx.setOptions({ output: { path: 'playwright', barrel: { type: 'named' } } })
      ctx.setResolver(resolverPlaywright)
      ctx.addGenerator(playwrightGenerator)
    },
  },
}))

export default pluginPlaywright
