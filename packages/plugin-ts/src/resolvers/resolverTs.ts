import { resolveDataRef, resolveResponseRef, resolveResponseStatusRef } from '@internals/shared'
import { ensureValidVarName, pascalCase, toFilePath } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginTs } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-ts`. Decides the names and file paths
 * for every generated TypeScript type. Import this in other plugins that need
 * to reference the exact names `plugin-ts` produces without duplicating the
 * casing/file-layout rules.
 *
 * The `default` method is supplied by `defineResolver`. It uses PascalCase for
 * type names and PascalCase file paths (dotted names become `/`-joined) for files.
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
      if (type === 'file') return toFilePath(name, pascalCase)
      return ensureValidVarName(pascalCase(name))
    },
    resolveTypeName(name) {
      return ensureValidVarName(pascalCase(name))
    },
    resolvePathName(name, type) {
      if (type === 'file') return toFilePath(name, pascalCase)
      return ensureValidVarName(pascalCase(name))
    },
    resolveParamName(node, param) {
      return this.resolveTypeName(`${node.operationId} ${param.in} ${param.name}`)
    },
    resolveResponseStatusName(node, statusCode) {
      // A status backed by a single `$ref` inlines to the referenced component type, so no
      // redundant `<op>Status<code>` alias is emitted and consumers reference the base type.
      const inlined = resolveResponseStatusRef(node, statusCode)
      if (inlined) {
        return this.resolveTypeName(inlined.rawName)
      }
      return this.resolveTypeName(`${node.operationId} Status ${statusCode}`)
    },
    resolveDataName(node) {
      // A request body backed by a single `$ref` inlines to the referenced component type.
      const inlined = resolveDataRef(node)
      if (inlined) {
        return this.resolveTypeName(inlined.rawName)
      }
      return this.resolveTypeName(`${node.operationId} Data`)
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
      // When every response collapses to a single `$ref`, the `<op>Response` union is just the base
      // component, so reference it directly instead of emitting a redundant alias.
      const inlined = resolveResponseRef(node)
      if (inlined) {
        return this.resolveTypeName(inlined.rawName)
      }
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
