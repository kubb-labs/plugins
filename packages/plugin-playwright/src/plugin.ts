import path from 'node:path'
import { pluginTsName } from '@kubb/plugin-ts'
import { definePlugin } from 'kubb/kit'
import { playwrightGenerator } from './generators/playwrightGenerator.tsx'
import { resolverPlaywright } from './resolvers/resolverPlaywright.ts'
import { playwrightTemplatePath } from './templates.ts'
import type { PluginPlaywright } from './types.ts'

/**
 * Identifies the Playwright plugin in the Kubb driver.
 */
export const pluginPlaywrightName = 'plugin-playwright' satisfies PluginPlaywright['name']

/**
 * Generates native Playwright responses for HTTP operations with parameters and JSON bodies.
 * Query arrays use repeated keys. Null and undefined query and header values are omitted.
 * Native config options override generated values, except the operation's HTTP method.
 * Operations with cookie parameters or non-JSON request bodies are skipped.
 * Requires `pluginTs()` for the response types.
 */
export const pluginPlaywright = definePlugin<PluginPlaywright>((options) => ({
  name: pluginPlaywrightName,
  options,
  dependencies: [pluginTsName],
  hooks: {
    'kubb:plugin:setup'(ctx) {
      ctx.setOptions({ output: { path: 'playwright', barrel: { type: 'named' } }, baseURL: options.baseURL })
      ctx.setResolver(resolverPlaywright)
      ctx.addGenerator(playwrightGenerator)
      ctx.injectFile({
        baseName: 'playwright.ts',
        path: path.resolve(ctx.config.root, ctx.config.output.path, '.kubb/playwright.ts'),
        copy: playwrightTemplatePath,
      })
    },
  },
}))

export default pluginPlaywright
