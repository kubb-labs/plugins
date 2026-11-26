import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { addMacro, addTemplate, injectFile, Resolver, setResolver, useConfig } from '@kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginValibotName, pluginZodName, resolveValidatorLibrary } from './builders/validatorOptions.ts'
import { createClientTemplates } from './templates/client.tsx'
import { createSdkTemplate } from './templates/sdk.tsx'
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
    importPath,
    throwOnErrorDefault = true,
    validator = false,
    auth,
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
    group: group ?? null,
    baseURL,
    importPath,
    throwOnErrorDefault,
    validator,
    auth: { mode: auth?.mode ?? 'optional' },
    returnType,
    sdk: sdk ? { mode: sdk.mode ?? 'tag', name: sdk.name } : undefined,
    resolver: userResolver ? Resolver.merge<ResolverClient>(resolverClient, ...[userResolver].flat()) : resolverClient,
  }
}

export type SetupClientOptions = { resolved: ClientResolvedOptions; macros?: ClientOptions['macros']; client: string }

/**
 * Wires a client plugin in its `setup`: resolver, macros, client or SDK templates, and the `.kubb/` runtime with the plugin's own `client.ts`.
 */
export function setupClient({ resolved, macros = [], client }: SetupClientOptions): void {
  const config = useConfig()

  setResolver(resolved.resolver)
  addMacro(...defaultMacros, ...macros)

  const templates = templatePath('')
  for (const template of resolved.sdk
    ? [createSdkTemplate<ContractClientFactory>({ templates })]
    : createClientTemplates<ContractClientFactory>({ templates })) {
    addTemplate(template)
  }

  const root = path.resolve(config.root, config.output.path)
  const files = [
    ['serializers.ts', templatePath('serializers.ts')],
    ['mediaTypes.ts', templatePath('mediaTypes.ts')],
    ['types.ts', templatePath('types.ts')],
    ['auth.ts', templatePath('auth.ts')],
    ['retry.ts', templatePath('retry.ts')],
    ['core.ts', templatePath('core.ts')],
    ['client.ts', client],
    ['standardSchema.ts', templatePath('standardSchema.ts')],
  ] as const

  for (const [baseName, copy] of files) {
    injectFile({ baseName, path: path.resolve(root, '.kubb', baseName), copy })
  }
}

/**
 * Declares `plugin-ts` as optional, and the schema plugin of the `validator` library as required once a direction is on.
 */
export function clientDependencies(options: Pick<ClientOptions, 'validator'>) {
  const library = resolveValidatorLibrary(options.validator)

  return {
    [pluginTsName]: { optional: true },
    [pluginZodName]: { optional: library !== 'zod' },
    [pluginValibotName]: { optional: library !== 'valibot' },
  }
}
