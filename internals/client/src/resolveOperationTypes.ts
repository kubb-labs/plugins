import { type ast, Diagnostics, type GeneratorContext, type Group, type Output } from '@kubb/kit'
import { pluginTsName, type ResolverTs } from '@kubb/plugin-ts'
import type { PluginZod, ResolverZod } from '@kubb/plugin-zod'

// A type-only import: the query plugins bundle this file but do not depend on @kubb/plugin-zod.
const pluginZodName = 'plugin-zod' satisfies PluginZod['name']

type GeneratorDriver = GeneratorContext['driver']

/**
 * The per-operation type names a generated client references: the grouped input, the per-status
 * responses record its `RequestResult` is keyed on, and the headers each response declares.
 */
export type OperationTypeNames = {
  response: {
    /**
     * Resolves the name of the operation's grouped `{ body, path, query, headers, cookies }` input type.
     */
    options(node: ast.OperationNode): string
    /**
     * Resolves the name of the operation's per-status responses record type.
     */
    responses(node: ast.OperationNode): string
    /**
     * Resolves the name of the type of the headers one response declares. Left out, results keep untyped headers.
     */
    headers?(node: ast.OperationNode, statusCode: ast.StatusCode): string
  }
}

function getResponseHeadersEntries({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): Array<[ast.StatusCode, string]> {
  const resolve = types.response.headers
  if (!resolve) return []
  return node.responses
    .filter((response) => response.headers?.length)
    .map((response) => [response.statusCode, resolve.call(types.response, node, response.statusCode)])
}

/**
 * The headers type argument of `RequestResult`, such as `{ '200': LoginUserStatus200Headers }`, or `null` when no response declares headers.
 */
export function buildResponseHeadersType({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): string | null {
  const entries = getResponseHeadersEntries({ node, types }).map(([statusCode, name]) => `'${statusCode}': ${name}`)
  return entries.length ? `{ ${entries.join('; ')} }` : null
}

/**
 * A runtime result type, such as `RequestResult`, in its `WithHeaders` form when `headers` is set.
 */
export function resultTypeName(name: string, headers: unknown): string {
  return headers ? `${name}WithHeaders` : name
}

/**
 * A runtime result type with its arguments, such as `RequestResultWithHeaders<Responses, Headers, ThrowOnError>`.
 */
export function buildResultTypeRef(name: string, responses: string, headers: string | null, rest: Array<string | null> = []): string {
  return `${resultTypeName(name, headers)}<${[responses, headers, ...rest].filter(Boolean).join(', ')}>`
}

/**
 * The names of the headers types `buildResponseHeadersType` references, for the file's imports.
 */
export function getResponseHeadersTypeNames({ node, types }: { node: ast.OperationNode; types: OperationTypeNames }): Array<string> {
  return getResponseHeadersEntries({ node, types }).map(([, name]) => name)
}

/**
 * Where a generated client sources its operation types, plus the resolver and output the file
 * declaring them is resolved with.
 */
export type OperationTypeSource = OperationTypeNames & {
  /**
   * `plugin-ts` shaped resolver of the plugin supplying the names, also used to resolve the file they are exported from.
   */
  resolver: ResolverTs
  /**
   * The supplying plugin's own `output`, when it configured one.
   */
  output: Output | undefined
  /**
   * The supplying plugin's own `group`, when it configured one.
   */
  group: Group | undefined
}

/**
 * A `plugin-ts` shaped resolver whose operation type names point at the types `pluginZod({ inferred })`
 * exports next to each schema, so code written against `plugin-ts` names picks up the zod types.
 */
function toZodTypeResolver(resolver: ResolverZod): ResolverTs {
  const type = (name: string) => resolver.schema.type(name)

  return {
    ...resolver,
    // Class methods, so a spread drops them. `file` reads private fields, and `memo` gets its own key
    // space so these type names never share an entry with the zod names.
    file: resolver.file.bind(resolver),
    memo: (key: string, compute: () => unknown) => resolver.memo(`zodTypes:${key}`, compute),
    param: {
      name: (node: ast.OperationNode, p: ast.ParameterNode) => type(resolver.param.name(node, p)),
      path: (node: ast.OperationNode, p: ast.ParameterNode) => type(resolver.param.path(node, p)),
      query: (node: ast.OperationNode, p: ast.ParameterNode) => type(resolver.param.query(node, p)),
      headers: (node: ast.OperationNode, p: ast.ParameterNode) => type(resolver.param.headers(node, p)),
      cookies: (node: ast.OperationNode, p: ast.ParameterNode) => type(resolver.param.cookies(node, p)),
    },
    response: {
      body: (node: ast.OperationNode) => type(resolver.response.body(node)),
      status: (node: ast.OperationNode, statusCode: ast.StatusCode) => type(resolver.response.status(node, statusCode)),
      response: (node: ast.OperationNode) => type(resolver.response.response(node)),
      responses: (node: ast.OperationNode) => type(resolver.response.responses(node)),
      headers: (node: ast.OperationNode, statusCode: ast.StatusCode) => type(resolver.response.headers(node, statusCode)),
      options: (node: ast.OperationNode) => resolver.response.options(node),
    },
  } as unknown as ResolverTs
}

/**
 * Picks the plugin generated clients, query hooks, and MCP handlers take their operation types from.
 *
 * `pluginZod({ inferred: 'codec' })` wins, so a codec param takes its domain value. Otherwise `plugin-ts`
 * wins when it is in the pipeline, and without it any `pluginZod({ inferred })`. Throws
 * `KUBB_MISSING_DEPENDENCY` for `pluginName` when neither is available.
 *
 * @example
 * ```ts
 * const types = resolveOperationTypes(ctx.driver, ctx.plugin.name)
 * types.response.options(node) // 'GetPetByIdOptions', or 'GetPetByIdOptionsSchemaType' from zod
 * ```
 */
export function resolveOperationTypes(driver: GeneratorDriver, pluginName: string): OperationTypeSource {
  return driver.memo(`operationTypes:${pluginName}`, () => {
    const pluginTs = driver.getPlugin(pluginTsName)
    const pluginZod = driver.getPlugin(pluginZodName)

    if (pluginTs && pluginZod?.options?.inferred !== 'codec') {
      const resolver = driver.getResolver(pluginTsName)
      return { response: resolver.response, resolver, output: pluginTs.options?.output, group: pluginTs.options?.group ?? undefined }
    }

    if (!pluginZod?.options?.inferred) {
      throw new Diagnostics.Error({
        code: Diagnostics.code.missingDependency,
        severity: 'error',
        message: `Plugin "${pluginName}" has no source for operation types.`,
        help: `Add \`pluginTs()\` before "${pluginName}", or add \`pluginZod({ inferred: true })\`.`,
        location: { kind: 'config' },
        plugin: pluginName,
      })
    }

    const resolver = toZodTypeResolver(driver.getResolver(pluginZodName))
    return { response: resolver.response, resolver, output: pluginZod.options.output, group: pluginZod.options.group ?? undefined }
  })
}

declare global {
  namespace Kubb {
    interface MemoRegistry {
      operationTypes: OperationTypeSource
      /**
       * Nests every key the zod-backed `ResolverTs` memoizes, so it holds each of their value types.
       */
      zodTypes: unknown
    }
  }
}
