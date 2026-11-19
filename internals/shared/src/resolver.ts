import { ensureValidVarName, toFilePath } from '@internals/utils'
import { ast, casing } from '@kubb/kit'
import type { GeneratorContext, Resolver, ResolverFile, ResolverPartial } from '@kubb/kit'

/**
 * The shared top-level `name` of the operation plugins, computed once per operation name and build.
 */
export function resolveOperationName(this: Resolver, name: string): string {
  return this.memo(`operation:${name}`, () => ensureValidVarName(casing.camel(name)))
}

/**
 * Builds the allocation key for a declaration an operation owns. `scope` names which declaration
 * it is, so two of them never share an allocation even when a custom resolver gives both the same
 * name. Leave `scope` empty for the operation's own declaration.
 *
 * The key starts from the operation's input `pointer`, which macros keep, so a plugin whose macro
 * rewrites the method or path still resolves another plugin's names for the same operation.
 *
 * @example
 * ```ts
 * resolver.resolveName({ key: operationKey(node, 'response', 'status', 404), name })
 * ```
 */
export function operationKey(node: ast.OperationNode, ...scope: Array<string | number>): Array<string | undefined> {
  const source = node.pointer ? [node.pointer] : [node.method, node.path]
  return ['operation', ...source, ...scope.map(String)]
}

/**
 * The `param` namespace shared by the schema-producing plugins (ts, zod, faker):
 * per-parameter names plus the grouped `Path`/`Query`/`Headers`/`Cookies` names, all routed
 * through the plugin's top-level `name` casing.
 */
export type OperationParamResolver = {
  name(this: Resolver, node: ast.OperationNode, param: ast.ParameterNode): string
  path(this: Resolver, node: ast.OperationNode): string
  query(this: Resolver, node: ast.OperationNode): string
  headers(this: Resolver, node: ast.OperationNode): string
  cookies(this: Resolver, node: ast.OperationNode): string
}

/**
 * The `response` namespace shared by the schema-producing plugins: per-status,
 * body, and combined response names, all routed through the plugin's top-level
 * `name` casing.
 */
export type OperationResponseResolver = {
  status(this: Resolver, node: ast.OperationNode, statusCode: ast.StatusCode): string
  /**
   * Name of the headers a response declares, such as `ListPetsStatus200Headers`.
   */
  headers(this: Resolver, node: ast.OperationNode, statusCode: ast.StatusCode): string
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
    cookies(node) {
      const name = this.name(`${node.operationId} Cookies`)
      return this.resolveName({ key: operationKey(node, 'param', 'cookies'), name })
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
    headers(node, statusCode) {
      const name = this.name(`${node.operationId} Status ${statusCode} Headers`)
      return this.resolveName({ key: operationKey(node, 'response', 'headers', statusCode), name })
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

/**
 * Builds a memoized, valid-identifier `name` and a `file` that share one casing and affix.
 */
export function createCasedResolver(kind: 'camel' | 'pascal', affix: { prefix?: string; suffix?: string } = {}): ResolverPartial {
  const toCase = (part: string) => casing[kind](part, affix)
  return {
    name(name) {
      return this.memo(`name:${name}`, () => ensureValidVarName(toCase(name)))
    },
    file: createCasedFile(toCase),
  }
}

/**
 * Builds the shared `param` and `response` namespaces of the schema plugins.
 */
export function createOperationResolver(): ResolverPartial<Resolver & { param: OperationParamResolver; response: OperationResponseResolver }> {
  return { param: createOperationParamResolver(), response: createOperationResponseResolver() }
}

type ValidatorResolver = Resolver & {
  schema: Record<'typeName' | 'type' | 'inputName' | 'inputTypeName' | 'isName' | 'assertName', (name: string) => string>
  response: Record<'error' | 'options', (node: ast.OperationNode) => string>
}

/**
 * Builds the `schema` namespace and the `response.error` and `response.options` names shared by zod and valibot.
 */
export function createValidatorResolver(): ResolverPartial<ValidatorResolver> {
  return {
    schema: {
      typeName(name) {
        return this.memo(`typeName:${name}`, () => ensureValidVarName(casing.pascal(name, { suffix: 'schema type' })))
      },
      type(name) {
        return this.memo(`type:${name}`, () => ensureValidVarName(casing.pascal(name, { suffix: 'type' })))
      },
      inputName(name) {
        return this.name(`${name} input`)
      },
      inputTypeName(name) {
        return this.schema.typeName(`${name} input`)
      },
      isName(name) {
        return ensureValidVarName(casing.camel(name, { prefix: 'is' }))
      },
      assertName(name) {
        return ensureValidVarName(casing.camel(name, { prefix: 'assert' }))
      },
    },
    response: {
      error(node) {
        const name = this.name(`${node.operationId} Error`)
        return this.resolveName({ key: operationKey(node, 'response', 'error'), name })
      },
      options(node) {
        const name = this.schema.type(this.name(`${node.operationId} Options`))
        return this.resolveName({ key: operationKey(node, 'response', 'options'), name })
      },
    },
  }
}

/** Builds the top-level `name` (camelCase, `handler` suffix) and the `handler` namespace of msw and mcp. */
export function createHandlerResolver(): ResolverPartial<Resolver & { handler: { name(node: ast.OperationNode): string } }> {
  return {
    name(name) {
      // shortcut: skips ensureValidVarName to keep today's msw and mcp output; align with the other plugins in a breaking release.
      return this.memo(`name:${name}`, () => casing.camel(name, { suffix: 'handler' }))
    },
    handler: {
      name(node) {
        const name = this.name(node.operationId)
        return this.resolveName({ key: operationKey(node, 'handler', 'name'), name })
      },
    },
  }
}

type SchemaIndexContext = Pick<GeneratorContext, 'memo' | 'schemas'>

/**
 * Names of the schemas in a circular reference chain, computed once per build.
 */
export function getCircularNames(ctx: SchemaIndexContext): ReadonlySet<string> {
  return ctx.memo('circularNames:set', () => ast.graph.getCircularNames(ctx.schemas))
}

/**
 * Names of the schemas whose type is `enum`, computed once per build.
 */
export function getEnumNames(ctx: SchemaIndexContext): ReadonlySet<string> {
  return ctx.memo('enumNames:set', () => new Set(ctx.schemas.flatMap((schema) => (schema.type === 'enum' && schema.name ? [schema.name] : []))))
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
