import { createGroupConfig } from '@internals/shared'
import { definePlugin } from '@kubb/core'
import { zodGenerator } from './generators/zodGenerator.tsx'
import { resolverZod } from './resolvers/resolverZod.ts'
import type { PluginZod } from './types.ts'

/**
 * Canonical plugin name for `@kubb/plugin-zod`. Used for driver lookups and
 * cross-plugin dependency references.
 */
export const pluginZodName = 'plugin-zod' satisfies PluginZod['name']

/**
 * Generates Zod v4 schemas from an OpenAPI spec. Use them to validate API
 * responses at runtime, build form schemas, or feed back into router libraries
 * that consume Zod (tRPC, Hono, Elysia). Pair with `@kubb/plugin-client` and
 * set the client's `parser: 'zod'` to validate every response automatically.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginZod } from '@kubb/plugin-zod'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   plugins: [
 *     pluginTs(),
 *     pluginZod({
 *       output: { path: './zod' },
 *       typed: true,
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginZod = definePlugin<PluginZod>((options) => {
  const {
    output = { path: 'zod', barrel: { type: 'named' } },
    group,
    exclude = [],
    include,
    override = [],
    typed = false,
    operations = false,
    mini = false,
    guidType = 'uuid',
    regexType = 'literal',
    importPath = mini ? 'zod/mini' : 'zod',
    coercion = false,
    inferred = false,
    wrapOutput = undefined,
    printer,
    resolver: userResolver,
    macros: userMacros,
  } = options

  const groupConfig = createGroupConfig(group)

  return {
    name: pluginZodName,
    options,
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({
          output,
          exclude,
          include,
          override,
          group: groupConfig,
          typed,
          importPath,
          coercion,
          operations,
          inferred,
          guidType,
          regexType,
          mini,
          wrapOutput,
          printer,
        })
        ctx.setResolver(userResolver ? { ...resolverZod, ...userResolver } : resolverZod)
        if (userMacros?.length) {
          ctx.setMacros(userMacros)
        }
        ctx.addGenerator(zodGenerator)
      },
    },
  }
})

export default pluginZod
