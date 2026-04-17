import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginFaker } from '../types.ts'
import { resolverFaker } from './resolverFaker.ts'

/**
 * Legacy resolver for `@kubb/plugin-faker` that reproduces the naming conventions
 * used in Kubb v4. Enable via `compatibilityPreset: 'kubbV4'`.
 */
export const resolverFakerLegacy = defineResolver<PluginFaker>(() => {
  return {
    ...resolverFaker,
    pluginName: 'plugin-faker',
    default(name, type) {
      return camelCase(name, { isFile: type === 'file', prefix: 'create' })
    },
    resolvePathName(name, type) {
      return camelCase(name, { isFile: type === 'file', prefix: 'create' })
    },
    resolveResponseStatusName(node, statusCode) {
      if (statusCode === 'default') {
        return this.resolveName(`${node.operationId} Error`)
      }

      return this.resolveName(`${node.operationId} ${statusCode}`)
    },
    resolveDataName(node) {
      const suffix = node.method === 'GET' ? 'QueryRequest' : 'MutationRequest'
      return this.resolveName(`${node.operationId} ${suffix}`)
    },
    resolveResponseName(node) {
      const suffix = node.method === 'GET' ? 'QueryResponse' : 'MutationResponse'
      return this.resolveName(`${node.operationId} ${suffix}`)
    },
    resolvePathParamsName(node, _param) {
      return this.resolveName(`${node.operationId} PathParams`)
    },
    resolveQueryParamsName(node, _param) {
      return this.resolveName(`${node.operationId} QueryParams`)
    },
    resolveHeaderParamsName(node, _param) {
      return this.resolveName(`${node.operationId} HeaderParams`)
    },
  }
})
