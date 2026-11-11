import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createGroupConfig } from '@internals/shared'
import { addGenerator, injectFile, Resolver, setMacros, setResolver, useConfig } from '@kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { isValidatorEnabled } from './builders/validatorOptions.ts'
import { createClientGenerator } from './generators/clientGenerator.tsx'
import { createSdkGenerator } from './generators/sdkGenerator.tsx'
import { defaultMacros } from './macros.ts'
import { resolverClient } from './resolver.ts'
import type { ClientOptions, ClientResolvedOptions, ContractClientFactory, ResolverClient } from './types.ts'

// Resolved from a file directly in `src/`, so the same `../templates/` path works from `dist/`.
const templatePath = (name: string) => fileURLToPath(new URL(`../templates/${name}`, import.meta.url))

/**
 * Applies the client option defaults and merges a user `resolver` over the built-in one.
 */
export function resolveClientOptions(options: ClientOptions): ClientResolvedOptions {
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
 * Wires a client plugin in its `setup`: resolver, macros, client or SDK generator, and the `.kubb/` runtime with the plugin's own `client.ts`.
 */
export function setupClient({
  name,
  resolved,
  macros = [],
  client,
}: {
  name: string
  resolved: ClientResolvedOptions
  macros?: ClientOptions['macros']
  client: string
}): void {
  const config = useConfig()

  setResolver(resolved.resolver)
  setMacros([...defaultMacros, ...macros])

  const templates = templatePath('')
  addGenerator<ContractClientFactory>(resolved.sdk ? createSdkGenerator({ templates }) : createClientGenerator(name, { templates }))

  const root = path.resolve(config.root, config.output.path)
  const files = [
    ['serializers.ts', templatePath('serializers.ts')],
    ['mediaTypes.ts', templatePath('mediaTypes.ts')],
    ['core.ts', templatePath('core.ts')],
    ['client.ts', client],
    ['standardSchema.ts', templatePath('standardSchema.ts')],
  ] as const

  for (const [baseName, copy] of files) {
    injectFile({ baseName, path: path.resolve(root, '.kubb', baseName), copy })
  }
}

/**
 * Declares `plugin-ts` as optional and `plugin-zod` as required once `validator` enables a direction.
 */
export function clientDependencies(options: Pick<ClientOptions, 'validator'>) {
  return { [pluginTsName]: { optional: true }, [pluginZodName]: { optional: !isValidatorEnabled(options.validator) } }
}
