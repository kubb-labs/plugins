import { ensureValidVarName, toFilePath } from '@internals/utils'
import { ast, camelCase } from 'kubb/kit'
import type { GeneratorContext, Resolver, ResolverFile } from 'kubb/kit'

/**
 * The shared top-level `name` of the operation plugins, computed once per operation name and build.
 */
export function resolveOperationName(this: Resolver, name: string): string {
  return this.memo(`operation:${name}`, () => ensureValidVarName(camelCase(name)))
}

/**
 * Builds the allocation key for a declaration an operation owns. `scope` names which declaration
 * it is, so two of them never share an allocation even when a custom resolver gives both the same
 * name. Leave `scope` empty for the operation's own declaration.
 *
 * @example
 * ```ts
 * resolver.resolveName({ key: operationKey(node, 'response', 'status', 404), name })
 * ```
 */
export function operationKey(node: ast.OperationNode, ...scope: Array<string | number>): Array<string | undefined> {
  return ['operation', node.method, node.path, ...scope.map(String)]
}

/**
 * The `param` namespace shared by the schema-producing plugins (ts, zod, faker):
 * per-parameter names plus the grouped `Path`/`Query`/`Headers` names, all routed
 * through the plugin's top-level `name` casing.
 */
export type OperationParamResolver = {
  name(this: Resolver, node: ast.OperationNode, param: ast.ParameterNode): string
  path(this: Resolver, node: ast.OperationNode): string
  query(this: Resolver, node: ast.OperationNode): string
  headers(this: Resolver, node: ast.OperationNode): string
}

/**
 * The `response` namespace shared by the schema-producing plugins: per-status,
 * body, and combined response names, all routed through the plugin's top-level
 * `name` casing.
 */
export type OperationResponseResolver = {
  status(this: Resolver, node: ast.OperationNode, statusCode: ast.StatusCode): string
  body(this: Resolver, node: ast.OperationNode): string
  responses(this: Resolver, node: ast.OperationNode): string
  response(this: Resolver, node: ast.OperationNode): string
}

/**
 * Builds the shared `param` namespace. Spread the result into `createResolver`
 * and override individual methods next to it when a plugin deviates.
 *
 * @example
 * ```ts
 * createResolver<PluginTs>({ param: createOperationParamResolver(), ... })
 * ```
 */
export function createOperationParamResolver(): OperationParamResolver {
  return {
    name(node, param) {
      const name = this.name(`${node.operationId} ${param.in} ${param.name}`)
      return this.resolveName({ key: operationKey(node, 'param', 'name', param.in, param.name), name })
    },
    path(node) {
      const name = this.name(`${node.operationId} Path`)
      return this.resolveName({ key: operationKey(node, 'param', 'path'), name })
    },
    query(node) {
      const name = this.name(`${node.operationId} Query`)
      return this.resolveName({ key: operationKey(node, 'param', 'query'), name })
    },
    headers(node) {
      const name = this.name(`${node.operationId} Headers`)
      return this.resolveName({ key: operationKey(node, 'param', 'headers'), name })
    },
  }
}

/**
 * Builds the shared `response` namespace. Spread the result into
 * `createResolver` and add plugin-specific methods (`options`, `error`) next
 * to it.
 *
 * @example
 * ```ts
 * createResolver<PluginTs>({ response: { ...createOperationResponseResolver(), options(node) {...} }, ... })
 * ```
 */
export function createOperationResponseResolver(): OperationResponseResolver {
  return {
    status(node, statusCode) {
      const name = this.name(`${node.operationId} Status ${statusCode}`)
      return this.resolveName({ key: operationKey(node, 'response', 'status', statusCode), name })
    },
    body(node) {
      const name = this.name(`${node.operationId} Body`)
      return this.resolveName({ key: operationKey(node, 'response', 'body'), name })
    },
    responses(node) {
      const name = this.name(`${node.operationId} Responses`)
      return this.resolveName({ key: operationKey(node, 'response', 'responses'), name })
    },
    response(node) {
      const name = this.name(`${node.operationId} Response`)
      return this.resolveName({ key: operationKey(node, 'response', 'response'), name })
    },
  }
}

/**
 * Builds a resolver `file` override whose base name runs every path segment
 * through `toFilePath`, casing the final segment with `caseLast`.
 *
 * @example
 * ```ts
 * createResolver<PluginTs>({ file: createCasedFile(pascalCase), ... })
 * ```
 */
export function createCasedFile(caseLast: (part: string) => string): ResolverFile {
  return {
    baseName({ name, extname }) {
      return this.memo(`file:${name}\0${extname}`, (): ast.FileNode['baseName'] => `${toFilePath(name, caseLast)}${extname}`)
    },
  }
}

type SchemaIndexContext = Pick<GeneratorContext, 'memo' | 'driver'>

/**
 * Names of the schemas in a circular reference chain, computed once per build.
 */
export function getCircularNames(ctx: SchemaIndexContext): ReadonlySet<string> {
  return ctx.memo('circularNames:set', () => ast.findCircularSchemas(ctx.driver.inputNode?.schemas ?? []))
}

/**
 * Names of the schemas whose type is `enum`, computed once per build.
 */
export function getEnumNames(ctx: SchemaIndexContext): ReadonlySet<string> {
  return ctx.memo(
    'enumNames:set',
    () => new Set((ctx.driver.inputNode?.schemas ?? []).flatMap((schema) => (schema.type === 'enum' && schema.name ? [schema.name] : []))),
  )
}

declare global {
  namespace Kubb {
    interface MemoRegistry {
      operation: string
      file: ast.FileNode['baseName']
      operationTypeNames: Array<string>
    }
  }
}
