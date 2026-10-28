import { createGroupConfig } from '@internals/shared'
import { addGenerator, defineExtension, Resolver, setMacros, setResolver } from 'kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { pluginTsName } from '@kubb/plugin-ts'
import { fakerGenerator } from './generators/fakerGenerator.tsx'
import { resolverFaker } from './resolvers/resolverFaker.ts'
import type { PluginFaker } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-faker`. Used for driver lookups and
 * cross-plugin dependency references.
 */
export const pluginFakerName = 'plugin-faker' satisfies PluginFaker['name']

/**
 * Generates one mock-data factory per OpenAPI schema using Faker.js. Call
 * `createPet()` to get a realistic `Pet` object. Useful for tests, Storybook,
 * and local development without a running backend.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginFaker } from '@kubb/plugin-faker'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginFaker({
 *       output: { path: './mocks' },
 *       seed: [100],
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginFaker = defineExtension<PluginFaker>({
  kind: 'plugin',
  meta: { name: pluginFakerName, version, compatibility },
  dependencies: { [pluginTsName]: {} },
  setup(options) {
    const {
      output = { path: 'mocks', barrel: { type: 'named' } },
      seed,
      locale = 'en',
      group,
      exclude = [],
      include,
      override = [],
      typeMode = 'inferred',
      dateParser = 'faker',
      regexGenerator = 'faker',
      printer,
      resolver: userResolver,
      macros: userMacros,
    } = options

    setResolver(userResolver ? Resolver.merge(resolverFaker, userResolver) : resolverFaker)
    if (userMacros?.length) {
      setMacros(userMacros)
    }
    addGenerator(fakerGenerator)

    return {
      output,
      seed,
      locale,
      exclude,
      include,
      override,
      typeMode,
      group: createGroupConfig(group),
      dateParser,
      regexGenerator,
      printer,
    }
  },
})

export default pluginFaker
