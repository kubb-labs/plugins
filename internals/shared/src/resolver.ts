import { camelCase, ensureValidVarName, toFilePath } from '@internals/utils'
import type { ast, Resolver, ResolverFile } from 'kubb/kit'

export function resolveOperationName(name: string): string {
  return ensureValidVarName(camelCase(name))
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
      return this.resolveName({ node, scope: ['param', 'name', param.in, param.name], name })
    },
    path(node) {
      const name = this.name(`${node.operationId} Path`)
      return this.resolveName({ node, scope: ['param', 'path'], name })
    },
    query(node) {
      const name = this.name(`${node.operationId} Query`)
      return this.resolveName({ node, scope: ['param', 'query'], name })
    },
    headers(node) {
      const name = this.name(`${node.operationId} Headers`)
      return this.resolveName({ node, scope: ['param', 'headers'], name })
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
      return this.resolveName({ node, scope: ['response', 'status', statusCode], name })
    },
    body(node) {
      const name = this.name(`${node.operationId} Body`)
      return this.resolveName({ node, scope: ['response', 'body'], name })
    },
    responses(node) {
      const name = this.name(`${node.operationId} Responses`)
      return this.resolveName({ node, scope: ['response', 'responses'], name })
    },
    response(node) {
      const name = this.name(`${node.operationId} Response`)
      return this.resolveName({ node, scope: ['response', 'response'], name })
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
      return `${toFilePath(name, caseLast)}${extname}`
    },
  }
}
