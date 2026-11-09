import path from 'node:path'
import { createGroupConfig } from '@internals/shared'
import { addGenerator, injectFile, Resolver, setMacros, setResolver, useConfig, useOptions } from '@kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { isValidatorEnabled } from './builders/validatorOptions.ts'
import { createClientGenerator } from './generators/clientGenerator.tsx'
import { createSdkGenerator } from './generators/sdkGenerator.tsx'
import { defaultMacros } from './macros.ts'
import { resolverClient } from './resolver.ts'
import type { ContractClientFactory, Options, ResolvedOptions, ResolverClient } from './types.ts'

/**
 * Absolute paths of the runtime files a client plugin copies into `.kubb/`. `client` is the plugin's own transport.
 */
export type ClientTemplates = {
  client: string
  core: string
  mediaTypes: string
  serializers: string
  standardSchema: string
  sse: string
}

/**
 * Applies the client option defaults and merges a user `resolver` over the built-in one.
 */
export function resolveClientOptions(options: Options): ResolvedOptions {
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

  return {
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
}

/**
 * Wires a client plugin inside its `setup`: the resolver, the default and user macros, the client or SDK generator,
 * and the `.kubb/` runtime files. `sse.ts` is copied by the generator, and only for a document that streams.
 */
export function setupClient({ resolved, templates }: { resolved: ResolvedOptions; templates: ClientTemplates }): void {
  const config = useConfig()
  const options = useOptions<ContractClientFactory>()

  setResolver(resolved.resolver)
  setMacros([...defaultMacros, ...(options.macros ?? [])])

  // `sdk` swaps the per-operation functions for the class-based SDK; left unset, the standalone
  // functions (which query plugins consume) stay.
  addGenerator<ContractClientFactory>(resolved.sdk ? createSdkGenerator({ sse: templates.sse }) : createClientGenerator('client', { sse: templates.sse }))

  const root = path.resolve(config.root, config.output.path)
  const files = [
    ['serializers.ts', templates.serializers],
    ['mediaTypes.ts', templates.mediaTypes],
    ['core.ts', templates.core],
    ['client.ts', templates.client],
    ['standardSchema.ts', templates.standardSchema],
  ] as const

  for (const [baseName, copy] of files) {
    injectFile({ baseName, path: path.resolve(root, '.kubb', baseName), copy })
  }
}

/**
 * Declares the plugins a client plugin builds on. `plugin-ts` supplies the operation types unless it is absent, in which
 * case `pluginZod({ inferred: true })` does. `plugin-zod` is required once `validator` enables a direction, so a missing
 * one fails setup instead of codegen.
 */
export function clientDependencies(options: Pick<Options, 'validator'>) {
  return { [pluginTsName]: { optional: true }, [pluginZodName]: { optional: !isValidatorEnabled(options.validator) } }
}
