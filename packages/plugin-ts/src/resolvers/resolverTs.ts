import { pascalCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginTs } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-ts`. Decides the names and file paths
 * for every generated TypeScript type. Import this in other plugins that need
 * to reference the exact names `plugin-ts` produces without duplicating the
 * casing/file-layout rules.
 *
 * The `default` method is supplied by `defineResolver`. It uses PascalCase for
 * type names and PascalCase-with-isFile for files.
 *
 * @example Resolve a type and file name
 * ```ts
 * import { resolverTs } from '@kubb/plugin-ts'
 *
 * resolverTs.default('list pets', 'type')        // 'ListPets'
 * resolverTs.resolvePathName('list pets', 'file') // 'ListPets'
 * resolverTs.resolveResponseStatusName(node, 200) // 'ListPetsStatus200'
 * ```
 */
export const resolverTs = defineResolver<PluginTs>(() => {
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
      return this.resolveTypeName(`${node.operationId} ${param.in} ${param.name}`)
    },
    resolveResponseStatusName(node, statusCode) {
      return this.resolveTypeName(`${node.operationId} Status ${statusCode}`)
    },
    resolveDataName(node) {
      return this.resolveTypeName(`${node.operationId} Data`)
    },
    resolveRequestConfigName(node) {
      return this.resolveTypeName(`${node.operationId} RequestConfig`)
    },
    resolveResponsesName(node) {
      return this.resolveTypeName(`${node.operationId} Responses`)
    },
    resolveResponseName(node) {
      return this.resolveTypeName(`${node.operationId} Response`)
    },
    resolveEnumKeyName(node, enumTypeSuffix = 'key') {
      return `${this.resolveTypeName(node.name ?? '')}${enumTypeSuffix}`
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
