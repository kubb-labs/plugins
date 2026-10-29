import path from 'node:path'
import { createGroupConfig } from '@internals/shared'
import { addGenerator, defineExtension, injectFile, Resolver, setMacros, setResolver, useConfig } from 'kubb/kit'
import type { ExtensionMeta, Generator, PluginFactory } from 'kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { isValidatorEnabled } from './builders/validatorOptions.ts'
import { createSdkGenerator } from './generators/sdkGenerator.tsx'
import { defaultMacros } from './macros.ts'
import { resolverClient } from './resolver.ts'
import type { ContractClientFactory, ResolvedOptions, ResolverClient } from './types.ts'

/**
 * Builds a client plugin that bundles its runtime into `.kubb/`, such as `@kubb/plugin-fetch` and
 * `@kubb/plugin-axios`. The plugins differ only in their meta, their operation generator, and the
 * transport-specific templates copied into `.kubb/client.ts` and `.kubb/serializers.ts`.
 */
export function createContractClientPlugin<TFactory extends ContractClientFactory>({
  meta,
  clientGenerator,
  templates,
}: {
  meta: ExtensionMeta & { name: TFactory['name'] }
  clientGenerator: Generator<TFactory>
  /**
   * Absolute paths of the templates copied into `.kubb/client.ts`, `.kubb/serializers.ts`, and `.kubb/standardSchema.ts`.
   */
  templates: { client: string; serializers: string; standardSchema: string }
}): PluginFactory<TFactory> {
  return defineExtension<TFactory>({
    kind: 'plugin',
    meta,
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
      addGenerator(resolved.sdk ? createSdkGenerator<TFactory>() : clientGenerator)

      const root = path.resolve(config.root, config.output.path)
      const baseURLExpression = baseURL ? (baseURL.includes('${') ? `\`${baseURL.replaceAll('`', '\\`')}\`` : JSON.stringify(baseURL)) : undefined

      injectFile({
        baseName: 'serializers.ts',
        path: path.resolve(root, '.kubb/serializers.ts'),
        copy: templates.serializers,
      })

      injectFile({
        baseName: 'client.ts',
        path: path.resolve(root, '.kubb/client.ts'),
        copy: templates.client,
        footer: baseURLExpression ? `client.setConfig({ baseURL: ${baseURLExpression} })` : undefined,
      })

      injectFile({
        baseName: 'standardSchema.ts',
        path: path.resolve(root, '.kubb/standardSchema.ts'),
        copy: templates.standardSchema,
      })

      return resolved
    },
  })
}
