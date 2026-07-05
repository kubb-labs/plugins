import { createHash } from 'node:crypto'
import path from 'node:path'
import { camelCase, ensureValidVarName, toFilePath } from '@internals/utils'
import { defineResolver } from 'kubb/kit'
import type { PluginFaker, ResolverFaker } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-faker`. Decides the names and file
 * paths for every generated mock factory. Functions and files are prefixed
 * with `create` so `Pet` becomes `createPet`.
 *
 * @example Resolve a factory name
 * ```ts
 * import { resolverFaker } from '@kubb/plugin-faker'
 *
 * resolverFaker.core.name('list pets') // 'createListPets'
 * ```
 */
export const resolverFaker = defineResolver<PluginFaker>(() => {
  return {
    name: 'default',
    pluginName: 'plugin-faker',
    core: {
      name(name) {
        return ensureValidVarName(camelCase(name, { prefix: 'create' }))
      },
      fileName(name) {
        return toFilePath(name, (part) => camelCase(part, { prefix: 'create' }))
      },
      file(this: ResolverFaker, { name, extname, tag, path: groupPath }, context) {
        const resolvedName = context.output.mode === 'file' ? '' : this.core.fileName(name)
        const inputBaseName = `${resolvedName}${extname}` as `${string}.${string}`
        const filePath = this.core.path(
          {
            baseName: inputBaseName,
            tag,
            path: groupPath,
          },
          context,
        )
        const baseName = path.basename(filePath) as `${string}.${string}`

        return {
          kind: 'File',
          id: createHash('sha256').update(filePath).digest('hex'),
          name: path.basename(filePath, extname),
          path: filePath,
          baseName,
          extname,
          meta: { pluginName: this.pluginName },
          sources: [],
          imports: [],
          exports: [],
        }
      },
    },
    resolveName(name) {
      return this.core.name(name)
    },
    resolveParamName(node, param) {
      return this.resolveName(`${node.operationId} ${param.in} ${param.name}`)
    },
    resolveBodyName(node) {
      return this.resolveName(`${node.operationId} Body`)
    },
    resolveResponseStatusName(node, statusCode) {
      return this.resolveName(`${node.operationId} Status ${statusCode}`)
    },
    resolveResponseName(node) {
      return this.resolveName(`${node.operationId} Response`)
    },
    resolveResponsesName(node) {
      return this.resolveName(`${node.operationId} Responses`)
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
