import { ensureValidVarName, pascalCase, toFilePath } from '@internals/utils'
import { createResolver } from 'kubb/kit'
import type { PluginTs } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-ts`. Decides the names and file paths
 * for every generated TypeScript type. Import this in other plugins that need
 * to reference the exact names `plugin-ts` produces without duplicating the
 * casing/file-layout rules.
 *
 * The `default` helpers are supplied by `createResolver`. This plugin overrides the top-level `name`
 * to use PascalCase for value and type names and `file` to write PascalCase file paths (dotted names
 * become `/`-joined), and groups the operation-specific naming under the `param`, `response`, and
 * `enum` namespaces.
 *
 * @example Resolve a type and file name
 * ```ts
 * import { resolverTs } from '@kubb/plugin-ts'
 *
 * resolverTs.name('list pets')                     // 'ListPets'
 * resolverTs.response.status(node, 200)            // 'ListPetsStatus200'
 * ```
 */
export const resolverTs = createResolver<PluginTs>({
  pluginName: 'plugin-ts',
  name(name) {
    return ensureValidVarName(pascalCase(name))
  },
  file: {
    baseName({ name, extname }) {
      return `${toFilePath(name, pascalCase)}${extname}`
    },
  },
  param: {
    name(node, param) {
      return this.name(`${node.operationId} ${param.in} ${param.name}`)
    },
    path(node) {
      return this.name(`${node.operationId} Path`)
    },
    query(node) {
      return this.name(`${node.operationId} Query`)
    },
    headers(node) {
      return this.name(`${node.operationId} Headers`)
    },
  },
  response: {
    status(node, statusCode) {
      return this.name(`${node.operationId} Status ${statusCode}`)
    },
    options(node) {
      return this.name(`${node.operationId} Options`)
    },
    responses(node) {
      return this.name(`${node.operationId} Responses`)
    },
    response(node) {
      return this.name(`${node.operationId} Response`)
    },
    body(node) {
      return this.name(`${node.operationId} Body`)
    },
  },
  enum: {
    keyName(node, enumTypeSuffix = 'key') {
      return `${this.name(node.name ?? '')}${enumTypeSuffix}`
    },
  },
})
