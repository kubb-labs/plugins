import { createCasedResolver, createOperationResolver, createValidatorResolver } from '@internals/shared'
import { Resolver } from '@kubb/kit'
import type { ResolverValibot } from '../types.ts'

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
export const resolverValibot = Resolver.merge<ResolverValibot>(
  { pluginName: 'plugin-valibot' },
  createCasedResolver('camel', { suffix: 'schema' }),
  createOperationResolver(),
  createValidatorResolver(),
)
