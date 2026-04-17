import { defineResolver } from '@kubb/core'
import type { PluginZod } from '../types.ts'
import { resolverZod } from './resolverZod.ts'

/**
 * Legacy resolver for `@kubb/plugin-zod` that reproduces the naming conventions
 * used in Kubb v4. Use this resolver directly when you need legacy naming.
 * (or by composing this resolver manually).
 *
 * Key differences from the default resolver:
 * - Response status types: `<operationId><StatusCode>Schema` (e.g. `createPets201Schema`) instead of `<operationId>Status201Schema`
 * - Default/error responses: `<operationId>ErrorSchema` instead of `<operationId>StatusDefaultSchema`
 * - Request body: `<operationId>MutationRequestSchema` (non-GET) / `<operationId>QueryRequestSchema` (GET)
 * - Combined responses type: `<operationId>MutationSchema` / `<operationId>QuerySchema`
 * - Response union: `<operationId>MutationResponseSchema` / `<operationId>QueryResponseSchema`
 *
 * @example
 * ```ts
 * import { resolverZodLegacy } from '@kubb/plugin-zod'
 *
 * resolverZodLegacy.resolveResponseStatusName(node, 201)  // → 'createPets201Schema'
 * resolverZodLegacy.resolveResponseStatusName(node, 'default')  // → 'createPetsErrorSchema'
 * resolverZodLegacy.resolveDataName(node)  // → 'createPetsMutationRequestSchema' (POST)
 * resolverZodLegacy.resolveResponsesName(node)  // → 'createPetsMutationSchema' (POST)
 * resolverZodLegacy.resolveResponseName(node)  // → 'createPetsMutationResponseSchema' (POST)
 * ```
 */
export const resolverZodLegacy = defineResolver<PluginZod>(() => {
  return {
    ...resolverZod,
    pluginName: 'plugin-zod',
    resolveResponseStatusName(node, statusCode) {
      if (statusCode === 'default') {
        return this.resolveSchemaName(`${node.operationId} Error`)
      }
      return this.resolveSchemaName(`${node.operationId} ${statusCode}`)
    },
    resolveDataName(node) {
      const suffix = node.method === 'GET' ? 'QueryRequest' : 'MutationRequest'
      return this.resolveSchemaName(`${node.operationId} ${suffix}`)
    },
    resolveResponsesName(node) {
      const suffix = node.method === 'GET' ? 'Query' : 'Mutation'
      return this.resolveSchemaName(`${node.operationId} ${suffix}`)
    },
    resolveResponseName(node) {
      const suffix = node.method === 'GET' ? 'QueryResponse' : 'MutationResponse'
      return this.resolveSchemaName(`${node.operationId} ${suffix}`)
    },
    resolvePathParamsName(node, _param) {
      return this.resolveSchemaName(`${node.operationId} PathParams`)
    },
    resolveQueryParamsName(node, _param) {
      return this.resolveSchemaName(`${node.operationId} QueryParams`)
    },
    resolveHeaderParamsName(node, _param) {
      return this.resolveSchemaName(`${node.operationId} HeaderParams`)
    },
  }
})
