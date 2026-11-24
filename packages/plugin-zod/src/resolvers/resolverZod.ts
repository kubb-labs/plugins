import { createSchemaResolver } from '@internals/shared'
import type { PluginZod } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-zod`. Decides the names and file
 * paths for every generated Zod schema. Schemas use camelCase with a
 * `Schema` suffix (`listPetsSchema`); their inferred types use PascalCase
 * with a `SchemaType` suffix (`PetSchemaType`), so the value and the type
 * never share an identifier even when the schema name is all-uppercase.
 *
 * @example Resolve schema and type names
 * ```ts
 * import { resolverZod } from '@kubb/plugin-zod'
 *
 * resolverZod.name('list pets')          // 'listPetsSchema'
 * resolverZod.schema.typeName('pet')     // 'PetSchemaType'
 * ```
 */
export const resolverZod = createSchemaResolver<PluginZod>('plugin-zod')
