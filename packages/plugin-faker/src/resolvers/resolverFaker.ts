import { createHash } from 'node:crypto'
import path from 'node:path'
import { camelCase } from '@internals/utils'
import { defineResolver, PluginDriver } from '@kubb/core'
import type { PluginFaker } from '../types.ts'

/**
 * Reserved words that cannot be used as identifiers in strict mode JavaScript.
 *
 * Covers ES2015+ keywords, strict-mode-only reserved words (`eval`, `arguments`),
 * future reserved words, and literal values.
 */
const STRICT_MODE_RESERVED_WORDS = new Set([
  // Keywords
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  // Strict mode reserved
  'let',
  'static',
  'implements',
  'interface',
  'package',
  'private',
  'protected',
  'public',
  'yield',
  // Restricted in strict mode
  'eval',
  'arguments',
  // Future reserved / literals
  'await',
  'enum',
  'null',
  'true',
  'false',
  'undefined',
])

/** Matches a valid ECMAScript identifier (ASCII subset, no unicode escapes). */
const IDENTIFIER_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

function isValidStrictIdentifier(name: string): boolean {
  return IDENTIFIER_RE.test(name) && !STRICT_MODE_RESERVED_WORDS.has(name)
}

/**
 * Naming convention resolver for Faker plugin.
 *
 * Provides default naming helpers using camelCase with a `create` prefix for factory functions and files.
 *
 * @example
 * `resolverFaker.default('list pets', 'function')  // → 'createListPets'`
 */
export const resolverFaker = defineResolver<PluginFaker>(() => {
  return {
    name: 'default',
    pluginName: 'plugin-faker',
    default(name, type) {
      const resolvedName = camelCase(name, { isFile: type === 'file', prefix: 'create' })

      if (type === 'file' || isValidStrictIdentifier(resolvedName)) {
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
      const pathMode = PluginDriver.getMode(path.resolve(context.root, context.output.path))
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
