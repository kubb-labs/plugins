import { getOperationParameters, getRequestGroupOptionality, resolveErrorNames, resolveSuccessNames } from '@internals/shared'
import type { ast } from 'kubb/kit'
import { createFunctionParameter, createFunctionParameters, createObjectBindingPattern, createTypeLiteral } from '@kubb/plugin-ts'
import type { FunctionParameterNode, FunctionParametersNode, PluginTs, ResolverTs } from '@kubb/plugin-ts'
import type { Infinite, Mutation, Query } from './types.ts'

/**
 * The grouped request options, ordered for both the destructured signature and the
 * call passed to the underlying client.
 */
const requestGroupOrder = ['path', 'query', 'body', 'headers'] as const

type RequestGroupKey = (typeof requestGroupOrder)[number]

/**
 * Widens a request-group member type so a generated TanStack hook accepts either the value or a
 * deferred value. Both plugins apply this through the `memberTypeWrapper` of `buildGroupedRequestParam`;
 * they only differ in how the deferred form is later resolved.
 *
 * `maybeRefOrGetter` is used by vue-query, which keeps the ref/getter live and unwraps it lazily with
 * `toValue` because vue-query keys are reactive. `maybeValueOrGetter` is used by react-query, which
 * resolves the getter once at the hook boundary and forwards a plain value because React Query hashes
 * keys structurally and cannot hold a function.
 */
export function maybeRefOrGetter(type: string): string {
  return `MaybeRefOrGetter<${type}>`
}

export function maybeValueOrGetter(type: string): string {
  return `${type} | (() => ${type})`
}

/**
 * Builds the grouped `{ path, query, body, headers }` parameter that mirrors the client
 * function signature. Only the groups the operation carries are emitted, typed from the
 * operation's `Options`. `keys` narrows the emitted groups, used by the query key which
 * never carries `headers`.
 *
 * By default the whole group is typed as the single `Options` reference. When
 * `memberTypeWrapper` is set, each group is emitted as its own member typed from the matching
 * `Options['<group>']` slice and wrapped, used by vue-query to apply
 * `MaybeRefOrGetter` per group.
 */
export function buildGroupedRequestParam(
  node: ast.OperationNode,
  options: {
    resolver: ResolverTs
    keys?: ReadonlyArray<RequestGroupKey>
    memberTypeWrapper?: (type: string) => string
  },
): FunctionParameterNode | null {
  const { resolver, keys = requestGroupOrder, memberTypeWrapper } = options
  const { groups, hasRequiredPath, hasRequiredQuery, hasRequiredHeader } = getRequestGroupOptionality(node)
  const names = keys.filter((key) => groups[key])

  if (names.length === 0) {
    return null
  }

  const requiredByGroup: Record<RequestGroupKey, boolean> = {
    path: hasRequiredPath,
    query: hasRequiredQuery,
    body: groups.body,
    headers: hasRequiredHeader,
  }

  // The grouped object can default to `{}` only when none of the emitted groups is required. The
  // query key narrows `keys`, so optionality is computed over the emitted groups, not all of them.
  const isOptional = names.every((name) => !requiredByGroup[name])

  // Drop the groups this binding never destructures (the query key omits `headers`), so a group
  // that is required elsewhere does not leak into a binding that does not carry it.
  const optionsName = resolver.response.options(node)
  const omittedKeys = requestGroupOrder.filter((key) => !keys.includes(key))
  const optionsType = omittedKeys.length > 0 ? `Omit<${optionsName}, ${omittedKeys.map((key) => `'${key}'`).join(' | ')}>` : optionsName

  if (memberTypeWrapper) {
    const members = names.map((name) => ({
      name,
      type: memberTypeWrapper(`${optionsType}['${name}']`),
      optional: !requiredByGroup[name],
    }))

    return createFunctionParameter({
      name: createObjectBindingPattern({ elements: names.map((name) => ({ name })) }),
      type: createTypeLiteral({ members }),
      optional: false,
      ...(isOptional ? { default: '{}' } : {}),
    })
  }

  return createFunctionParameter({
    name: createObjectBindingPattern({ elements: names.map((name) => ({ name })) }),
    type: optionsType,
    optional: false,
    ...(isOptional ? { default: '{}' } : {}),
  })
}

/**
 * Builds the shared `({ path, query, body, headers }, config = {})` parameter list for a
 * TanStack query-options function. The leading parameter mirrors the client signature, and the
 * trailing `config` is a partial `RequestConfig` minus the grouped data-shape keys, which are passed
 * explicitly. Framework plugins wrap the result when needed, for example vue-query applies `MaybeRefOrGetter`.
 */
export function buildQueryOptionsParams(
  node: ast.OperationNode,
  options: { resolver: ResolverTs; memberTypeWrapper?: (type: string) => string },
): FunctionParametersNode {
  const { resolver, memberTypeWrapper } = options

  const groupedParam = buildGroupedRequestParam(node, { resolver, memberTypeWrapper })

  const configParam = createFunctionParameter({
    name: 'config',
    type: `Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'url'>>`,
    default: '{}',
  })

  return createFunctionParameters({ params: [groupedParam, configParam].filter((param): param is FunctionParameterNode => param !== null) })
}

/**
 * Builds the call to a client `<op>` function inside a query/mutation hook body. The function takes
 * a single grouped options object, so the operation's request groups are passed as
 * shorthand alongside the spread `config`, with `throwOnError: true` pinned last so a caller's config
 * can't flip the query's error semantics. Queries thread the TanStack `signal`; mutations omit it.
 *
 * When `unwrapName` is set, each request group is passed as an explicit member unwrapped through it,
 * used by vue-query to resolve refs and getters with `toValue(...)` at call time.
 *
 * @example
 * ```ts
 * buildClientCall(node, { clientName: 'getPetById', signal: true })
 * // getPetById({ path, ...config, signal: config.signal ?? signal, throwOnError: true })
 * ```
 */
export function buildClientCall(node: ast.OperationNode, options: { clientName: string; signal?: boolean; unwrapName?: (name: string) => string }): string {
  const { clientName, signal = false, unwrapName } = options
  const { groups } = getRequestGroupOptionality(node)
  const names = requestGroupOrder.filter((key) => groups[key])

  const args = [
    '...config',
    ...names.map((name) => (unwrapName ? `${name}: ${unwrapName(name)}` : name)),
    signal ? 'signal: config.signal ?? signal' : null,
    'throwOnError: true',
  ].filter((part): part is string => part !== null)

  return `${clientName}({ ${args.join(', ')} })`
}

type ResponseTypes = {
  TData: string
  TError: string
}

type PageParamType = {
  queryParamsTypeName: string | null
  pageParamType: string
}

type ResolvePageParamTypeParams = {
  resolver: ResolverTs
  initialPageParam: Infinite['initialPageParam']
  queryParam?: Infinite['queryParam']
}

/**
 * Builds the `TData` / `TError` type expressions shared by every generated hook, joining the resolved
 * success responses into `TData` and wrapping the error responses in `ResponseErrorConfig<...>`.
 */
export function buildResponseTypes(node: ast.OperationNode, resolver: ResolverTs): ResponseTypes {
  const successNames = resolveSuccessNames(node, resolver)
  const responseName = successNames.length > 0 ? successNames.join(' | ') : resolver.response.response(node)
  const errorNames = resolveErrorNames(node, resolver)

  return {
    TData: responseName,
    TError: `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`,
  }
}

function resolveFallbackPageParamType(initialPageParam: Infinite['initialPageParam']): string {
  if (typeof initialPageParam === 'number') return 'number'
  if (typeof initialPageParam === 'boolean') return 'boolean'
  if (typeof initialPageParam !== 'string') return 'unknown'
  if (!initialPageParam.includes(' as ')) return 'string'

  return initialPageParam.split(' as ').at(-1) ?? 'unknown'
}

/**
 * Resolves the `TPageParam` generic for the infinite-query hooks. Prefers the type read from the
 * configured `queryParam` on the operation's query object, and falls back to the type inferred from
 * `initialPageParam` when that parameter type is unavailable. Also returns the query params type name
 * so callers can reuse it when rewriting the paginated request.
 */
export function resolvePageParamType(node: ast.OperationNode, { resolver, initialPageParam, queryParam }: ResolvePageParamTypeParams): PageParamType {
  const firstQueryParam = getOperationParameters(node, { paramsCasing: 'original' }).query[0]
  const groupName = firstQueryParam ? resolver.param.query(node, firstQueryParam) : null
  const individualName = firstQueryParam ? resolver.param.name(node, firstQueryParam) : null
  const queryParamsTypeName = groupName !== individualName ? groupName : null

  const queryParamType = queryParam && queryParamsTypeName ? `${queryParamsTypeName}['${queryParam}']` : null

  if (!queryParamType) {
    return { queryParamsTypeName, pageParamType: resolveFallbackPageParamType(initialPageParam) }
  }

  const isInitialPageParamDefined = initialPageParam !== undefined && initialPageParam !== null

  return { queryParamsTypeName, pageParamType: isInitialPageParamDefined ? `NonNullable<${queryParamType}>` : queryParamType }
}

/**
 * Applies the shared query defaults during plugin setup: `false` disables query generation, and an
 * object merges over `methods: ['GET']` and the plugin's runtime `importPath`.
 */
export function resolveQueryConfig(query: Partial<Query> | false, options: { importPath: string }): Required<Query> | false {
  if (query === false) return false
  return { importPath: options.importPath, methods: ['GET'], ...query }
}

/**
 * Applies the shared mutation defaults during plugin setup: `false` disables mutation generation,
 * and an object merges over `methods: ['POST', 'PUT', 'PATCH', 'DELETE']` and the plugin's runtime
 * `importPath`.
 */
export function resolveMutationConfig(mutation: Partial<Mutation> | false, options: { importPath: string }): Required<Mutation> | false {
  if (mutation === false) return false
  return { importPath: options.importPath, methods: ['POST', 'PUT', 'PATCH', 'DELETE'], ...mutation }
}

/**
 * Applies the shared infinite-query defaults during plugin setup: a falsy value disables infinite
 * queries, and an object merges over `queryParam: 'id'` and `initialPageParam: 0` with the cursor
 * paths cleared.
 */
export function resolveInfiniteConfig(infinite: Partial<Infinite> | false): Required<Infinite> | false {
  if (!infinite) return false
  return { queryParam: 'id', initialPageParam: 0, cursorParam: null, nextParam: null, previousParam: null, ...infinite }
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
  response?: {
    response?: (node: ast.OperationNode) => string | undefined
    body?: (node: ast.OperationNode) => string | undefined
  }
  param?: {
    query?: (node: ast.OperationNode, param: ast.ParameterNode) => string | undefined
  }
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
  const { query: queryParams } = getOperationParameters(node, { paramsCasing: 'original' })
  return [
    resolveResponseParser(parser) === 'zod' ? zodResolver.response?.response?.(node) : null,
    resolveRequestParser(parser) === 'zod' && node.requestBody?.content?.[0]?.schema ? zodResolver.response?.body?.(node) : null,
    resolveQueryParamsParser(parser) === 'zod' && queryParams.length > 0 ? zodResolver.param?.query?.(node, queryParams[0]!) : null,
  ].filter((n): n is string => Boolean(n))
}

/**
 * Build QueryKey params as the grouped `{ path, query, body }` object (NO headers, NO config),
 * typed from the operation's `Options` minus `url`. The query key transformer reads the
 * grouped `path`/`query`/`body` bindings.
 */
export function buildQueryKeyParams(node: ast.OperationNode, options: { resolver: PluginTs['resolver'] }): FunctionParametersNode {
  const { resolver } = options
  const groupedParam = buildGroupedRequestParam(node, { resolver, keys: ['path', 'query', 'body'] })

  return createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
}
