import { ensureValidVarName, pascalCase, toFilePath } from '@internals/utils'
import { defineResolver } from 'kubb/kit'
import type { PluginTs } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-ts`. Decides the names and file paths
 * for every generated TypeScript type. Import this in other plugins that need
 * to reference the exact names `plugin-ts` produces without duplicating the
 * casing/file-layout rules.
 *
 * The `core` helpers are supplied by `defineResolver`. This plugin overrides them to use PascalCase
 * for value and type names and PascalCase file paths (dotted names become `/`-joined) for files.
 *
 * @example Resolve a type and file name
 * ```ts
 * import { resolverTs } from '@kubb/plugin-ts'
 *
 * resolverTs.core.name('list pets')                // 'ListPets'
 * resolverTs.core.fileName('list pets')            // 'ListPets'
 * resolverTs.resolveResponseStatusName(node, 200)  // 'ListPetsStatus200'
 * ```
 */
export const resolverTs = defineResolver<PluginTs>(() => {
  return {
    name: 'default',
    pluginName: 'plugin-ts',
    core: {
      name(name) {
        return ensureValidVarName(pascalCase(name))
      },
      fileName(name) {
        return toFilePath(name, pascalCase)
      },
    },
    resolveTypeName(name) {
      return this.core.name(name)
    },
    resolveParamName(node, param) {
      return this.resolveTypeName(`${node.operationId} ${param.in} ${param.name}`)
    },
    resolveResponseStatusName(node, statusCode) {
      return this.resolveTypeName(`${node.operationId} Status ${statusCode}`)
    },
    resolveBodyName(node) {
      return this.resolveTypeName(`${node.operationId} Body`)
    },
    resolveRequestConfigName(node) {
      // NOTE(v5-stable): the `RequestConfig` suffix is kept through the beta to avoid churn, but it
      // overlaps with the runtime client's `RequestConfig`. Revisit renaming to `Request` before stable.
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
    resolvePathName(node, param) {
      return this.resolveParamName(node, param)
    },
    resolveQueryName(node, param) {
      return this.resolveParamName(node, param)
    },
    resolveHeadersName(node, param) {
      return this.resolveParamName(node, param)
    },
  }
})
