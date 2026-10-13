import { createGroupConfig } from '@internals/shared'
import { pluginTsName } from '@kubb/plugin-ts'
import { definePlugin, Resolver } from 'kubb/kit'
import { playwrightGenerator } from './generators/playwrightGenerator.tsx'
import { resolverPlaywright } from './resolvers/resolverPlaywright.ts'
import type { PluginPlaywright } from './types.ts'

/**
 * Identifies the Playwright plugin in the Kubb driver.
 */
export const pluginPlaywrightName = 'plugin-playwright' satisfies PluginPlaywright['name']

/**
 * Generates native Playwright responses for HTTP operations with parameters, JSON bodies, and forms.
 * Adapts query arrays and values incompatible with Playwright's native parameter and form types.
 * Native options are spread over generated values, except the operation's HTTP method.
 * Supports JSON, URL-encoded forms, and multipart bodies. Other body media types and cookie parameters are skipped.
 * Playwright handles body serialization, Content-Type, and errors. Use options for custom serialization.
 * Requires `pluginTs()` for the response types.
 */
export const pluginPlaywright = definePlugin<PluginPlaywright>((options) => ({
  name: pluginPlaywrightName,
  options,
  dependencies: [pluginTsName],
  hooks: {
    'kubb:plugin:setup'(ctx) {
      const resolver = options.resolver ? Resolver.merge(resolverPlaywright, options.resolver) : resolverPlaywright
      ctx.setOptions({
        output: options.output ?? { path: 'playwright', barrel: { type: 'named' } },
        group: createGroupConfig(options.group),
        exclude: options.exclude ?? [],
        include: options.include,
        override: options.override ?? [],
        baseURL: options.baseURL,
        resolver,
      })
      ctx.setResolver(resolver)
      if (options.macros?.length) ctx.setMacros(options.macros)
      ctx.addGenerator(playwrightGenerator)
    },
  },
}))

export default pluginPlaywright
