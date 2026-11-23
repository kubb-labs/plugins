import { addMacro, addTemplate, defineExtension, Resolver, setPrinter, setResolver } from '@kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { createPrinterValibot } from './printers/createPrinterValibot.ts'
import { valibotOperation, valibotSchema } from './templates/valibot.tsx'
import { resolverValibot } from './resolvers/resolverValibot.ts'
import type { PluginValibot } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-valibot`. Used for driver lookups and cross-plugin
 * dependency references.
 */
export const pluginValibotName = 'plugin-valibot' satisfies PluginValibot['name']

/**
 * Generates Valibot v1 schemas from an OpenAPI spec. Use them to validate API responses at
 * runtime, build form schemas, or pass them to any library that takes a Standard Schema.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb/config'
 * import { pluginValibot } from '@kubb/plugin-valibot'
 *
 * export default defineConfig({
 *   input: './petStore.yaml',
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginValibot({
 *       output: { path: './valibot' },
 *       inferred: true,
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginValibot = defineExtension<PluginValibot>({
  kind: 'plugin',
  meta: { name: pluginValibotName, version, compatibility },
  setup(options) {
    const {
      output = { path: 'valibot', barrel: { type: 'named' } },
      group,
      exclude = [],
      include,
      override = [],
      importPath = 'valibot',
      inferred = false,
      regexType = 'literal',
      oneOfType = 'union',
      coercion = false,
      typeGuards = false,
      printer,
      resolver: userResolver,
      macros: userMacros,
    } = options

    setResolver(userResolver ? Resolver.merge(resolverValibot, ...[userResolver].flat()) : resolverValibot)
    addMacro(...(userMacros ?? []))
    setPrinter(createPrinterValibot)
    addTemplate(valibotSchema)
    addTemplate(valibotOperation)

    return {
      output,
      exclude,
      include,
      override,
      group: group ?? null,
      importPath,
      inferred,
      regexType,
      oneOfType,
      coercion,
      typeGuards,
      printer,
    }
  },
})

export default pluginValibot
