import path from 'node:path'
import { createSdkGenerator, defaultMacros, isValidatorEnabled, resolverClient } from '@internals/client'
import { addGenerator, defineExtension, injectFile, Resolver, setMacros, setResolver, useConfig } from 'kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { clientGenerator } from './generators/clientGenerator.tsx'
import { fetchClientTemplatePath, fetchSerializersTemplatePath, standardSchemaTemplatePath } from './templates.ts'
import type { PluginFetch, ResolvedOptions, ResolverClient } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-fetch`. Used for driver lookups and cross-plugin
 * dependency references.
 */
export const pluginFetchName = 'plugin-fetch' satisfies PluginFetch['name']

/**
 * Generates a type-safe HTTP client pinned to the Fetch API. Each operation becomes one async
 * function that takes a single grouped `options` object and returns the shared `RequestResult`
 * contract. The runtime is always bundled into `.kubb/client.ts`, so generated code never imports
 * from `@kubb/plugin-fetch` and the only runtime dependency is the global `fetch`.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginFetch } from '@kubb/plugin-fetch'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginFetch({ output: { path: './clients' } }),
 *   ],
 * })
 * ```
 */
export const pluginFetch = defineExtension<PluginFetch>({
  kind: 'plugin',
  meta: { name: pluginFetchName, version, compatibility },
  // `plugin-ts` supplies the operation types unless it is absent, in which case `pluginZod({ inferred: true })`
  // does. `plugin-zod` is required once `validator` enables a direction, so a missing one fails setup instead of codegen.
  dependencies: (options) => ({ [pluginTsName]: { optional: true }, [pluginZodName]: { optional: !isValidatorEnabled(options.validator) } }),
  setup(options) {
    const config = useConfig()
    const {
      output = { path: 'clients', barrel: { type: 'named' } },
      exclude = [],
      include,
      override = [],
      baseURL,
      throwOnErrorDefault = true,
      validator = false,
      returnType = 'full',
      group,
      sdk,
      resolver: userResolver,
    } = options

    const resolved: ResolvedOptions = {
      output,
      exclude,
      include,
      override,
      group: group ?? null,
      baseURL,
      throwOnErrorDefault,
      validator,
      returnType,
      sdk: sdk ? { mode: sdk.mode ?? 'tag', name: sdk.name } : undefined,
      resolver: userResolver ? Resolver.merge<ResolverClient>(resolverClient, userResolver) : resolverClient,
    }

    setResolver(resolved.resolver)
    setMacros([...defaultMacros, ...(options.macros ?? [])])

    // `sdk` swaps the per-operation functions for the class-based SDK; left unset, the standalone
    // functions (which query plugins consume) stay.
    addGenerator(resolved.sdk ? createSdkGenerator<PluginFetch>() : clientGenerator)

    const root = path.resolve(config.root, config.output.path)
    const baseURLExpression = baseURL ? (baseURL.includes('${') ? `\`${baseURL.replaceAll('`', '\\`')}\`` : JSON.stringify(baseURL)) : undefined

    injectFile({
      baseName: 'serializers.ts',
      path: path.resolve(root, '.kubb/serializers.ts'),
      copy: fetchSerializersTemplatePath,
    })

    injectFile({
      baseName: 'client.ts',
      path: path.resolve(root, '.kubb/client.ts'),
      copy: fetchClientTemplatePath,
      footer: baseURLExpression ? `client.setConfig({ baseURL: ${baseURLExpression} })` : undefined,
    })

    injectFile({
      baseName: 'standardSchema.ts',
      path: path.resolve(root, '.kubb/standardSchema.ts'),
      copy: standardSchemaTemplatePath,
    })

    return resolved
  },
})

export default pluginFetch
