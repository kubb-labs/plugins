import { createGroupConfig } from '@internals/shared'
import { addGenerator, defineExtension, Resolver, setMacros, setResolver } from 'kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { typeGenerator } from './generators/typeGenerator.tsx'
import { refResolverTs, resolverTs } from './resolvers/resolverTs.ts'
import type { PluginTs } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-ts`. Used for driver lookups and
 * cross-plugin dependency references.
 */
export const pluginTsName = 'plugin-ts' satisfies PluginTs['name']

/**
 * Generates TypeScript `type` aliases and `interface` declarations from an
 * OpenAPI spec. The foundation that every other Kubb plugin builds on:
 * clients, query hooks, mocks, and validators all reference the names this
 * plugin produces.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs({
 *       output: { path: './types' },
 *       enum: { type: 'asConst' },
 *       optionalType: 'questionTokenAndUndefined',
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginTs = defineExtension<PluginTs>({
  kind: 'plugin',
  meta: { name: pluginTsName, version, compatibility },
  setup(options) {
    const {
      output = { path: 'types', barrel: { type: 'named' } },
      group,
      exclude = [],
      include,
      override = [],
      enum: enumOptions = {},
      optionalType = 'questionToken',
      arrayType = 'array',
      syntaxType = 'type',
      operationTypes = true,
      printer,
      resolver: userResolver,
      macros: userMacros,
    } = options

    const resolvedEnum = {
      type: enumOptions.type ?? 'asConst',
      constCasing: enumOptions.constCasing ?? 'camelCase',
      typeSuffix: enumOptions.typeSuffix ?? 'Key',
      keyCasing: enumOptions.keyCasing ?? 'none',
    }

    const baseResolver = operationTypes ? resolverTs : Resolver.merge(resolverTs, refResolverTs)
    setResolver(userResolver ? Resolver.merge(baseResolver, userResolver) : baseResolver)
    if (userMacros?.length) {
      setMacros(userMacros)
    }
    addGenerator(typeGenerator)

    return {
      output,
      exclude,
      include,
      override,
      optionalType,
      group: createGroupConfig(group),
      arrayType,
      enum: resolvedEnum,
      syntaxType,
      printer,
    }
  },
})

export default pluginTs
