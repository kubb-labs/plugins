import { createCasedFile, createOperationParamResolver, createOperationResponseResolver } from '@internals/shared'
import { ensureValidVarName, pascalCase } from '@internals/utils'
import { createResolver } from 'kubb/kit'
import type { PluginTs } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-ts`. Decides the names and file paths
 * for generated TypeScript types. Other plugins should read the build's resolver
 * through `driver.getResolver(pluginTsName)` to share its name allocations.
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
  file: createCasedFile(pascalCase),
  param: createOperationParamResolver(),
  response: {
    ...createOperationResponseResolver(),
    options(node) {
      const name = this.name(`${node.operationId} Options`)
      return this.resolveName({ key: ['operation', node.method, node.path, name], name })
    },
  },
  enum: {
    keyName(node, enumTypeSuffix = 'key') {
      return `${this.name(node.name ?? '')}${enumTypeSuffix}`
    },
  },
})
