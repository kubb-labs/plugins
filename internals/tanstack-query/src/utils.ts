import {
  castToClientOptions,
  getOperationParameters,
  getPrimarySuccessResponse,
  getRequestGroupOptionality,
  getRequestGroups,
  hasRequestContentTypeChoice,
  isEventStream,
  resolveErrorNames,
  resolveSuccessNames,
} from '@internals/shared'
import type { ast } from 'kubb/kit'
import { createFunctionParameter, createFunctionParameters, createObjectBindingPattern, createTypeLiteral } from '@kubb/plugin-ts'
import type { FunctionParameterNode, FunctionParametersNode, PluginTs, ResolverTs } from '@kubb/plugin-ts'
import type { Infinite, Mutation, PageParamFn, Query } from './types.ts'

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
    /** Binds the variables whole, so destructuring does not drop the chosen media type. */
    withContentType?: boolean
  },
): FunctionParameterNode | null {
  const { resolver, keys = requestGroupOrder, memberTypeWrapper, withContentType = false } = options
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
  if (withContentType && hasRequestContentTypeChoice(node)) {
    return createFunctionParameter({ name: 'variables', type: optionsName, optional: false })
  }

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
export function buildClientCall(
  node: ast.OperationNode,
  options: { clientName: string; signal?: boolean; unwrapName?: (name: string) => string; withContentType?: boolean; returnType?: 'full' | 'data' | 'plain' },
): string {
  const { clientName, signal = false, unwrapName, withContentType = false, returnType = 'full' } = options
  const { groups } = getRequestGroupOptionality(node)
  const names = requestGroupOrder.filter((key) => groups[key])

  const args = [
    '...config',
    ...(withContentType && hasRequestContentTypeChoice(node) ? ['...variables'] : names.map((name) => (unwrapName ? `${name}: ${unwrapName(name)}` : name))),
    signal ? 'signal: config.signal ?? signal' : null,
    'throwOnError: true',
  ].filter((part): part is string => part !== null)

  if (withContentType && hasRequestContentTypeChoice(node)) return `${clientName}(${castToClientOptions(`{ ${args.join(', ')} }`, clientName, returnType)})`

  return `${clientName}({ ${args.join(', ')} })`
}

/**
 * Builds the query/mutation body that resolves a `buildClientCall` expression down to the bare
 * success body. `returnType` mirrors the registered client plugin's own `returnType` option: with
 * `'data'` the call already resolves to the bare body, so it is returned directly; with `'full'`
 * (the default) the call carries `unwrap()`, so the body calls it instead of destructuring `data`
 * off the full result by hand. With `'plain'` (plugin-client) the call resolves to the user's
 * `RequestResult`, so the body awaits it and reads `data`.
 *
 * @example
 * ```ts
 * buildCallResultBody(buildClientCall(node, { clientName: 'getPetById' }))
 * // return getPetById({ ...config, throwOnError: true }).unwrap()
 * ```
 */
export function buildCallResultBody(call: string, options: { returnType?: 'full' | 'data' | 'plain' } = {}): string {
  const { returnType = 'full' } = options
  if (returnType === 'data') {
    return `return await ${call}`
  }
  if (returnType === 'plain') {
    return `return (await ${call}).data`
  }
  return `return ${call}.unwrap()`
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
  return resolver.memo(`responseTypes:${node.operationId}`, () => {
    const successNames = resolveSuccessNames(node, resolver)
    const responseName = successNames.length > 0 ? successNames.join(' | ') : resolver.response.response(node)
    const errorNames = resolveErrorNames(node, resolver)

    return {
      TData: responseName,
      TError: `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`,
    }
  })
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
  const firstQueryParam = getOperationParameters(node).query[0]
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
 * object merges over `methods: ['GET', 'QUERY']` and the plugin's runtime `importPath`. QUERY
 * (RFC 10008) is a safe, idempotent read that carries its input in the body, so it is a query too.
 */
export function resolveQueryConfig(query: Partial<Query> | false, options: { importPath: string }): Required<Query> | false {
  if (query === false) return false
  return { importPath: options.importPath, methods: ['GET', 'QUERY'], ...query }
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

type OperationClassification = {
  isQuery: boolean
  isMutation: boolean
}

type ClassifyOperationParams = {
  query: Required<Query> | false
  mutation: Required<Mutation> | false
}

/**
 * Classifies an operation as a query or a mutation from the resolved `query` / `mutation` method lists.
 * Disabled query and mutation configs do not claim operations, and a method already claimed by an
 * enabled query config never counts as a mutation. Event streams are consumed through the client
 * directly, so they do not generate query or mutation hooks.
 */
export function classifyOperation(node: ast.HttpOperationNode, { query, mutation }: ClassifyOperationParams): OperationClassification {
  if (isEventStream(node)) return { isQuery: false, isMutation: false }

  const isQuery = !!query && query.methods.some((method) => node.method.toLowerCase() === method.toLowerCase())
  const queryMethods = new Set(query ? query.methods : [])
  const isMutation =
    mutation !== false &&
    !isQuery &&
    (mutation ? mutation.methods : []).some((method) => !queryMethods.has(method) && node.method.toLowerCase() === method.toLowerCase())

  return { isQuery, isMutation }
}

/**
 * Helper to define a typed page param function for `infinite.getNextPageParam` or
 * `infinite.getPreviousPageParam`. Serializes the function to a string for inlining in generated code.
 *
 * Note: Because the function is inlined verbatim into the generated file via `.toString()`,
 * it must be self-contained and cannot reference local closures or external variables from
 * the config file.
 */
export function definePageParam<TPage = any, TParam = any>(fn: PageParamFn<TPage, TParam>): string {
  return fn.toString()
}

/**
 * Applies the shared infinite-query defaults during plugin setup: a falsy value disables infinite
 * queries, and an object merges over `queryParam: 'id'` and `initialPageParam: 0` with the cursor
 * paths cleared.
 */
export function resolveInfiniteConfig(infinite: Partial<Infinite> | false): Required<Infinite> | false {
  if (!infinite) return false
  const hasExplicitInitialPageParam = infinite.hasExplicitInitialPageParam ?? infinite.initialPageParam !== undefined
  const getNextPageParam = infinite.getNextPageParam
    ? typeof infinite.getNextPageParam === 'function'
      ? infinite.getNextPageParam.toString()
      : infinite.getNextPageParam
    : null
  const getPreviousPageParam = infinite.getPreviousPageParam
    ? typeof infinite.getPreviousPageParam === 'function'
      ? infinite.getPreviousPageParam.toString()
      : infinite.getPreviousPageParam
    : null

  return {
    queryParam: 'id',
    initialPageParam: 0,
    hasExplicitInitialPageParam,
    cursorParam: null,
    nextParam: null,
    previousParam: null,
    getNextPageParam,
    getPreviousPageParam,
    ...infinite,
    ...(getNextPageParam ? { getNextPageParam } : {}),
    ...(getPreviousPageParam ? { getPreviousPageParam } : {}),
  }
}

/**
 * Whether the infinite hook for `node` should be generated: the operation takes the configured
 * `queryParam`.
 */
export function matchesInfinite(node: ast.OperationNode, infinite: Infinite): boolean {
  if (!infinite.queryParam) return false
  // Strip trailing '?' which OpenAPI specs sometimes append to parameter names to denote optionality
  return getOperationParameters(node).query.some((param) => param.name.replace(/\?$/, '') === infinite.queryParam)
}

/**
 * Warning for an infinite hook that falls back to the built-in page params on a response that
 * isn't an array. Those params only stop on an empty array, so `hasNextPage` never turns false.
 */
export function getDefaultPageParamsWarning(node: ast.OperationNode, infinite: Infinite): string | null {
  const usesDefault =
    infinite.getNextPageParam == null &&
    infinite.getPreviousPageParam == null &&
    infinite.nextParam == null &&
    infinite.previousParam == null &&
    !infinite.cursorParam
  if (!usesDefault) return null

  const content = getPrimarySuccessResponse(node)?.content
  const jsonContent = content?.find((item) => item.contentType?.includes('json')) ?? content?.[0]
  const schema = jsonContent?.schema

  let resolved: ast.SchemaNode | null | undefined = schema
  while (resolved?.type === 'ref' || (resolved?.type === 'intersection' && resolved.members?.length === 1)) {
    resolved = resolved.type === 'ref' ? resolved.schema : resolved.members?.[0]
  }
  if (!resolved || resolved.type === 'array') return null

  return `${node.operationId}: the default infinite page params expect an array response and never end for this one. Set \`infinite.getNextPageParam\` (or \`nextParam\`) to read the next page from the response.`
}

type OverrideFilter = { type: string; pattern: string | RegExp } | { type: 'extension'; key: `x-${string}`; value?: unknown }

type OverrideEntry<TOptions> = OverrideFilter & {
  options?: Partial<TOptions>
}

function matchesPattern(node: ast.OperationNode, ov: OverrideFilter): boolean {
  if ('key' in ov) {
    const extensions = node.extensions
    if (!extensions || !(ov.key in extensions)) return false
    return ov.value === undefined || extensions[ov.key] === ov.value
  }
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

/**
 * The request groups a query key is built from, matching `buildQueryKeyParams`. Headers are
 * deliberately absent: they do not identify a cache entry, so the key factory takes no parameter
 * for an operation that only carries headers.
 */
export const queryKeyGroupOrder = ['path', 'query', 'body'] as const

/**
 * Whether the generated query key factory declares a parameter, so a call site passes an argument
 * only when one is accepted.
 */
export function hasQueryKeyParams(node: ast.OperationNode): boolean {
  const groups = getRequestGroups(node)
  return queryKeyGroupOrder.some((key) => groups[key])
}

/**
 * Build QueryKey params as the grouped `{ path, query, body }` object (NO headers, NO config),
 * typed from the operation's `Options` minus `url`. The query key transformer reads the
 * grouped `path`/`query`/`body` bindings.
 */
export function buildQueryKeyParams(
  node: ast.OperationNode,
  options: { resolver: PluginTs['resolver']; memberTypeWrapper?: (type: string) => string },
): FunctionParametersNode {
  const { resolver, memberTypeWrapper } = options
  const groupedParam = buildGroupedRequestParam(node, { resolver, keys: queryKeyGroupOrder, memberTypeWrapper })

  return createFunctionParameters({ params: groupedParam ? [groupedParam] : [] })
}

/**
 * Builds the hook parameter list: the grouped request param (omitted when `withRequest` is `false`) then `options` typed as `optionsType`.
 */
export function buildHookParams(
  node: ast.OperationNode,
  options: { resolver: ResolverTs; optionsType: string; memberTypeWrapper?: (type: string) => string; withRequest?: boolean },
): FunctionParametersNode {
  const { resolver, optionsType, memberTypeWrapper, withRequest = true } = options
  const optionsParam = createFunctionParameter({ name: 'options', type: optionsType, default: '{}' })
  const groupedParam = withRequest ? buildGroupedRequestParam(node, { resolver, memberTypeWrapper }) : null

  return createFunctionParameters({ params: [groupedParam, optionsParam].filter((param): param is FunctionParameterNode => param !== null) })
}

/**
 * The `TRequest` type argument of a mutation hook: the options type when the operation takes a request, else `undefined`.
 */
export function resolveMutationRequestType(node: ast.OperationNode, resolver: ResolverTs): string {
  return buildGroupedRequestParam(node, { resolver }) ? resolver.response.options(node) : 'undefined'
}

/**
 * Builds the object literal that unwraps each request group's getter before it reaches `queryKey`/`queryOptions`; `null` without a request group.
 */
export function buildResolvedRequestParams(node: ast.OperationNode): string | null {
  const groups = getRequestGroups(node)
  const names = requestGroupOrder.filter((key) => groups[key])
  if (names.length === 0) return null
  return `{ ${names.map((name) => `${name}: typeof ${name} === 'function' ? ${name}() : ${name}`).join(', ')} }`
}

declare global {
  namespace Kubb {
    interface MemoRegistry {
      responseTypes: ResponseTypes
    }
  }
}
