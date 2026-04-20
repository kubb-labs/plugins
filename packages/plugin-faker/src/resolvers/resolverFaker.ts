import { createHash } from 'node:crypto'
import path from 'node:path'
import { camelCase } from '@internals/utils'
import { defineResolver, PluginDriver } from '@kubb/core'
import type { PluginFaker } from '../types.ts'

function isValidStrictIdentifier(name: string): boolean {
  try {
    new Function(`"use strict"; const ${name} = 1;`)
  } catch {
    return false
  }

  return true
}

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
export const resolverFaker = defineResolver<PluginFaker>((ctx) => {
  return {
    name: 'default',
    pluginName: 'plugin-faker',
    default(name, type) {
      const resolvedName = camelCase(name, { isFile: type === 'file' })

      if (type === 'file' || isValidStrictIdentifier(resolvedName)) {
        return resolvedName
      }

      return `_${resolvedName}`
    },
    resolveName(name, type) {
      return ctx.default(name, type)
    },
    resolvePathName(name, type) {
      return ctx.default(name, type)
    },
    resolveFile({ name, extname, tag, path: groupPath }, context) {
      const pathMode = PluginDriver.getMode(path.resolve(context.root, context.output.path))
      const baseName = `${pathMode === 'single' ? '' : ctx.resolveName(name, 'file')}${extname}` as `${string}.${string}`
      const filePath = ctx.resolvePath(
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
        meta: { pluginName: ctx.pluginName },
        sources: [],
        imports: [],
        exports: [],
      }
    },
    resolveParamName(node, param) {
      return ctx.resolveName(`${node.operationId} ${param.in} ${param.name}`)
    },
    resolveDataName(node) {
      return ctx.resolveName(`${node.operationId} Data`)
    },
    resolveResponseStatusName(node, statusCode) {
      return ctx.resolveName(`${node.operationId} Status ${statusCode}`)
    },
    resolveResponseName(node) {
      return ctx.resolveName(`${node.operationId} Response`)
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
