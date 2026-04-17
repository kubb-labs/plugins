import { camelCase } from '@internals/utils'
import { defaultResolveFile, defineResolver } from '@kubb/core'
import type { PluginFaker, ResolverFaker } from '../types.ts'

/**
 * Default resolver for `@kubb/plugin-faker`.
 *
 * Uses camelCase naming for generated function and file names.
 *
 * @example
 * ```ts
 * resolverFaker.default('list pets', 'function') // -> 'listPets'
 * resolverFaker.resolveResponseStatusName(node, 200) // -> 'listPetsStatus200'
 * ```
 */
export const resolverFaker = defineResolver<PluginFaker>(() => {
  return {
    name: 'default',
    pluginName: 'plugin-faker',
    default(name, type) {
      return camelCase(name, { isFile: type === 'file' })
    },
    resolveName(name, type) {
      return this.default(name, type)
    },
    resolvePathName(name, type) {
      return this.default(name, type)
    },
    resolveFile(params, context) {
      const originalDefault = this.default
      const originalResolveName = this.resolveName

      const resolverForFile: ResolverFaker = {
        ...this,
        default(name, type) {
          const resolverWithOriginalDefault: ResolverFaker = {
            ...this,
            default: originalDefault,
          }

          return originalResolveName.call(resolverWithOriginalDefault, name, type)
        },
      }

      return defaultResolveFile.call(resolverForFile, params, context)
    },
    resolveParamName(node, param) {
      return this.resolveName(`${node.operationId} ${param.in} ${param.name}`)
    },
    resolveDataName(node) {
      return this.resolveName(`${node.operationId} Data`)
    },
    resolveResponseStatusName(node, statusCode) {
      return this.resolveName(`${node.operationId} Status ${statusCode}`)
    },
    resolveResponseName(node) {
      return this.resolveName(`${node.operationId} Response`)
    },
    resolvePathParamsName(node, param) {
      return this.resolveParamName(node, param)
    },
    resolveQueryParamsName(node, param) {
      return this.resolveParamName(node, param)
    },
    resolveHeaderParamsName(node, param) {
      return this.resolveParamName(node, param)
    },
  }
})
