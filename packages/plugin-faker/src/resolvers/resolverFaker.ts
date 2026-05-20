import { createHash } from 'node:crypto'
import path from 'node:path'
import { camelCase, isValidVarName } from '@internals/utils'
import { defineResolver, KubbDriver } from '@kubb/core'
import type { PluginFaker } from '../types.ts'

/**
 * Default resolver used by `@kubb/plugin-faker`. Decides the names and file
 * paths for every generated mock factory. Functions and files are prefixed
 * with `create` so `Pet` becomes `createPet`.
 *
 * @example Resolve a factory name
 * ```ts
 * import { resolverFaker } from '@kubb/plugin-faker'
 *
 * resolverFaker.default('list pets', 'function') // 'createListPets'
 * ```
 */
export const resolverFaker = defineResolver<PluginFaker>(() => {
  return {
    name: 'default',
    pluginName: 'plugin-faker',
    default(name, type) {
      const resolvedName = camelCase(name, { isFile: type === 'file', prefix: 'create' })

      if (type === 'file' || isValidVarName(resolvedName)) {
        return resolvedName
      }

      return `_${resolvedName}`
    },
    resolveName(name, type) {
      return this.default(name, type)
    },
    resolvePathName(name, type) {
      return this.default(name, type)
    },
    resolveFile({ name, extname, tag, path: groupPath }, context) {
      const pathMode = KubbDriver.getMode(path.resolve(context.root, context.output.path))
      const baseName = `${pathMode === 'single' ? '' : this.resolveName(name, 'file')}${extname}` as `${string}.${string}`
      const filePath = this.resolvePath(
        {
          baseName,
          pathMode,
          tag,
          path: groupPath,
        },
        context,
      )

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
    resolveResponsesName(node) {
      return this.resolveName(`${node.operationId} Responses`)
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
