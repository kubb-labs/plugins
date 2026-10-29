import path from 'node:path'
import { createSdkGenerator, defaultMacros, isValidatorEnabled, resolverClient } from '@internals/client'
import { createGroupConfig } from '@internals/shared'
import { addGenerator, defineExtension, injectFile, Resolver, setMacros, setResolver, useConfig } from '@kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { clientGenerator } from './generators/clientGenerator.tsx'
import { axiosClientTemplatePath, axiosSerializersTemplatePath, standardSchemaTemplatePath } from './templates.ts'
import type { PluginAxios, ResolvedOptions, ResolverClient } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-axios`. Used for driver lookups and cross-plugin
 * dependency references.
 */
export const pluginAxiosName = 'plugin-axios' satisfies PluginAxios['name']

/**
 * Generates a type-safe HTTP client pinned to axios. Each operation becomes one async function
 * that takes a single grouped `options` object and returns the shared `RequestResult` contract. The
 * runtime is always bundled into `.kubb/client.ts`, so generated code never imports from
 * `@kubb/plugin-axios` and the only runtime dependency is `axios`.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginAxios } from '@kubb/plugin-axios'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginAxios({ output: { path: './clients' } }),
 *   ],
 * })
 * ```
 */
export const pluginAxios = defineExtension<PluginAxios>({
  kind: 'plugin',
  meta: { name: pluginAxiosName, version, compatibility },
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
      group: createGroupConfig(group),
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
    addGenerator(resolved.sdk ? createSdkGenerator<PluginAxios>() : clientGenerator)

    const root = path.resolve(config.root, config.output.path)
    const baseURLExpression = baseURL ? (baseURL.includes('${') ? `\`${baseURL.replaceAll('`', '\\`')}\`` : JSON.stringify(baseURL)) : undefined

    injectFile({
      baseName: 'serializers.ts',
      path: path.resolve(root, '.kubb/serializers.ts'),
      copy: axiosSerializersTemplatePath,
    })

    injectFile({
      baseName: 'client.ts',
      path: path.resolve(root, '.kubb/client.ts'),
      copy: axiosClientTemplatePath,
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

export default pluginAxios
