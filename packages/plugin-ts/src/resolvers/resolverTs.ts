import { pascalCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginTs } from '../types.ts'

/**
 * Resolver for `@kubb/plugin-ts` that provides the default naming and path-resolution
 * helpers used by the plugin. Import this in other plugins to resolve the exact names and
 * paths that `plugin-ts` generates without hardcoding the conventions.
 *
 * The `default` method is automatically injected by `defineResolver` — it uses `camelCase`
 * for identifiers/files and `pascalCase` for type names.
 *
 * @example
 * ```ts
 * import { resolver } from '@kubb/plugin-ts'
 *
 * resolver.default('list pets', 'type')              // → 'ListPets'
 * resolver.resolveName('list pets status 200')        // → 'ListPetsStatus200'
 * resolver.resolvePathName('list pets', 'file')       // → 'listPets'
 * ```
 */
export const resolverTs = defineResolver<PluginTs>((ctx) => {
  return {
    name: 'default',
    pluginName: 'plugin-ts',
    default(name, type) {
      return pascalCase(name, { isFile: type === 'file' })
    },
    resolveTypeName(name) {
      return pascalCase(name)
    },
    resolvePathName(name, type) {
      return pascalCase(name, { isFile: type === 'file' })
    },
    resolveParamName(node, param) {
      return ctx.resolveTypeName(`${node.operationId} ${param.in} ${param.name}`)
    },
    resolveResponseStatusName(node, statusCode) {
      return ctx.resolveTypeName(`${node.operationId} Status ${statusCode}`)
    },
    resolveDataName(node) {
      return ctx.resolveTypeName(`${node.operationId} Data`)
    },
    resolveRequestConfigName(node) {
      return ctx.resolveTypeName(`${node.operationId} RequestConfig`)
    },
    resolveResponsesName(node) {
      return ctx.resolveTypeName(`${node.operationId} Responses`)
    },
    resolveResponseName(node) {
      return ctx.resolveTypeName(`${node.operationId} Response`)
    },
    resolveEnumKeyName(node, enumTypeSuffix = 'key') {
      return `${ctx.resolveTypeName(node.name ?? '')}${enumTypeSuffix}`
    },
    resolvePathParamsName(node, param) {
      return ctx.resolveParamName(node, param)
    },
    resolveQueryParamsName(node, param) {
      return ctx.resolveParamName(node, param)
    },
    resolveHeaderParamsName(node, param) {
      return ctx.resolveParamName(node, param)
    },
  }
})
