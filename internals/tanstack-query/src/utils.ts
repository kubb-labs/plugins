import { getOperationParameters, getRequestGroups } from '@internals/shared'
import { ast } from '@kubb/core'
import type { PluginTs, ResolverTs } from '@kubb/plugin-ts'

/**
 * The grouped request options, ordered for both the destructured signature and the
 * call passed to the underlying client.
 */
const requestGroupOrder = ['path', 'query', 'body', 'headers'] as const

type RequestGroupKey = (typeof requestGroupOrder)[number]

/**
 * Builds the grouped `{ path, query, body, headers }` parameter that mirrors the client
 * function signature. Only the groups the operation carries are emitted, typed from the
 * operation's `RequestConfig` (minus `url`). `keys` narrows the emitted groups, used by the
 * query key which never carries `headers`.
 *
 * By default the whole group is typed as the single `Omit<RequestConfig, 'url'>` reference. When
 * `memberTypeWrapper` is set, each group is emitted as its own member typed from the matching
 * `Omit<RequestConfig, 'url'>['<group>']` slice and wrapped, used by vue-query to apply
 * `MaybeRefOrGetter` per group.
 */
export function buildGroupedRequestParam(
  node: ast.OperationNode,
  options: {
    resolver: ResolverTs
    keys?: ReadonlyArray<RequestGroupKey>
    memberTypeWrapper?: (type: string) => string
  },
): ast.FunctionParameterNode | null {
  const { resolver, keys = requestGroupOrder, memberTypeWrapper } = options
  const groups = getRequestGroups(node)
  const names = keys.filter((key) => groups[key])

  if (names.length === 0) {
    return null
  }

  const { path: pathParams } = getOperationParameters(node)
  const hasRequiredPath = pathParams.some((param) => param.required)
  const isOptional = !hasRequiredPath && !groups.body

  const requestConfigType = `Omit<${resolver.resolveRequestConfigName(node)}, 'url'>`

  if (memberTypeWrapper) {
    const members = names.map((name) => ({
      name,
      type: memberTypeWrapper(`${requestConfigType}['${name}']`),
      optional: name === 'path' ? !hasRequiredPath : name !== 'body',
    }))

    return {
      kind: 'FunctionParameter',
      name: ast.factory.createObjectBindingPattern({ elements: names.map((name) => ({ name })) }),
      type: ast.factory.createTypeLiteral({ members }),
      optional: false,
      ...(isOptional ? { default: '{}' } : {}),
    }
  }

  return {
    kind: 'FunctionParameter',
    name: ast.factory.createObjectBindingPattern({ elements: names.map((name) => ({ name })) }),
    type: requestConfigType,
    optional: false,
    ...(isOptional ? { default: '{}' } : {}),
  }
}

/**
 * Builds the shared `({ path, query, body, headers }, config = {})` parameter list for a
 * TanStack query-options function. The leading parameter mirrors the client signature, and the
 * trailing `config` parameter is typed as a partial `RequestConfig` with an optional `client`.
 * Framework plugins wrap the result when needed, for example vue-query applies `MaybeRefOrGetter`.
 */
export function buildQueryOptionsParams(
  node: ast.OperationNode,
  options: { resolver: ResolverTs; memberTypeWrapper?: (type: string) => string },
): ast.FunctionParametersNode {
  const { resolver, memberTypeWrapper } = options
  const requestName = node.requestBody?.content?.[0]?.schema ? resolver.resolveDataName(node) : undefined

  const groupedParam = buildGroupedRequestParam(node, { resolver, memberTypeWrapper })

  const configParam = ast.factory.createFunctionParameter({
    name: 'config',
    type: requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }',
    default: '{}',
  })

  return ast.factory.createFunctionParameters({ params: [groupedParam, configParam].filter((param): param is ast.FunctionParameterNode => param !== null) })
}

export function transformName(name: string, type: string, transformers?: { name?: (name: string, type?: string) => string }): string {
  return transformers?.name?.(name, type) || name
}

type OverrideEntry<TOptions> = {
  type: string
  pattern: string | RegExp
  options?: Partial<TOptions>
}

function matchesPattern(node: ast.OperationNode, ov: { type: string; pattern: string | RegExp }): boolean {
  const { type, pattern } = ov
  const matches = (value: string) => (typeof pattern === 'string' ? value === pattern : pattern.test(value))
  if (type === 'operationId') return matches(node.operationId)
  if (type === 'tag') return node.tags.some((t) => matches(t))
  if (type === 'path') return node.path !== undefined && matches(node.path)
  if (type === 'method') return node.method !== undefined && matches(node.method)
  return false
}

/**
 * Resolves per-operation overrides (first matching override wins).
 *
 * @example
 * ```ts
 * const opts = resolveOperationOverrides(node, override)
 * const queryOpts = 'query' in opts ? opts.query : defaultQuery
 * ```
 */
export function resolveOperationOverrides<TOptions>(node: ast.OperationNode, override?: ReadonlyArray<OverrideEntry<TOptions>>): Partial<TOptions> {
  if (!override) return {}
  const match = override.find((ov) => matchesPattern(node, ov))
  return match?.options ?? {}
}

type ZodSchemaNameResolverLike = {
  resolveResponseName?: (node: ast.OperationNode) => string | undefined
  resolveDataName?: (node: ast.OperationNode) => string | undefined
  resolveQueryParamsName?: (node: ast.OperationNode, param: ast.ParameterNode) => string | undefined
}

type ParserOption = false | 'zod' | { request?: 'zod'; response?: 'zod' } | undefined

/**
 * Returns `'zod'` when response-direction parsing is enabled.
 * The string shorthand `'zod'` also enables response parsing.
 */
export function resolveResponseParser(parser: ParserOption): 'zod' | null {
  if (!parser) return null
  if (parser === 'zod') return 'zod'
  return parser.response ?? null
}

/**
 * Returns `'zod'` when request body parsing is enabled.
 * The string shorthand `'zod'` also enables request body parsing (existing behavior).
 */
export function resolveRequestParser(parser: ParserOption): 'zod' | null {
  if (!parser) return null
  if (parser === 'zod') return 'zod'
  return parser.request ?? null
}

/**
 * Returns `'zod'` when query-params parsing is enabled.
 * Only the object form `{ request: 'zod' }` enables this. `parser: 'zod'` does not.
 */
export function resolveQueryParamsParser(parser: ParserOption): 'zod' | null {
  if (!parser || parser === 'zod') return null
  return parser.request ?? null
}

/**
 * Collects the Zod schema import names for an operation based on the active parser directions.
 *
 * - `parser: 'zod'`: response and request body names (backward-compatible behavior).
 * - `parser: { request: 'zod' }`: request body and query params names.
 * - `parser: { response: 'zod' }`: response name only.
 * - `parser: { request: 'zod', response: 'zod' }`: all three.
 *
 * Returns an empty array when no resolver is provided or `parser` is falsy.
 */
export function resolveZodSchemaNames(node: ast.OperationNode, zodResolver: ZodSchemaNameResolverLike | null | undefined, parser: ParserOption): Array<string> {
  if (!zodResolver || !parser) return []
  const { query: queryParams } = getOperationParameters(node)
  return [
    resolveResponseParser(parser) === 'zod' ? zodResolver.resolveResponseName?.(node) : null,
    resolveRequestParser(parser) === 'zod' && node.requestBody?.content?.[0]?.schema ? zodResolver.resolveDataName?.(node) : null,
    resolveQueryParamsParser(parser) === 'zod' && queryParams.length > 0 ? zodResolver.resolveQueryParamsName?.(node, queryParams[0]!) : null,
  ].filter((n): n is string => Boolean(n))
}

/**
 * Build QueryKey params as the grouped `{ path, query, body }` object (NO headers, NO config),
 * typed from the operation's `RequestConfig` minus `url`. The query key transformer reads the
 * grouped `path`/`query`/`body` bindings.
 */
export function buildQueryKeyParams(node: ast.OperationNode, options: { resolver: PluginTs['resolver'] }): ast.FunctionParametersNode {
  const { resolver } = options
  const groupedParam = buildGroupedRequestParam(node, { resolver, keys: ['path', 'query', 'body'] })

  return ast.factory.createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
}

/**
 * Whether the operation has a path parameter that drives the `enabled` guard.
 * A query stays disabled until the grouped `path` option is provided.
 */
export function hasRequiredPathParams(node: ast.OperationNode): boolean {
  return getOperationParameters(node).path.some((param) => param.required)
}
