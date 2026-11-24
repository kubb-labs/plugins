import { createSchemaResolver } from '@internals/shared'
import type { PluginValibot } from '../types.ts'

/**
 * Default resolver for `@kubb/plugin-valibot`. Schema and file names are camelCase with a `Schema`
 * suffix, and inferred types are PascalCase.
 *
 * @example
 * ```ts
 * resolverValibot.name('list pets') // 'listPetsSchema'
 * resolverValibot.schema.typeName('pet') // 'PetSchemaType'
 * ```
 */
export const resolverValibot = createSchemaResolver<PluginValibot>('plugin-valibot')
