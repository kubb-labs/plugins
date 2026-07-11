import { getOperationParameters, getRequestGroups, resolveErrorNames, resolveSuccessNames } from '@internals/shared'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { ast } from 'kubb/kit'
import type { Infinite, ResolvedOptions } from './types.ts'

export { buildQueryKeyParams, maybeValueOrGetter, resolveOperationOverrides } from '@internals/tanstack-query'
export { buildClientOptionType, buildOperationComments as getComments, buildRequestConfigType } from '@internals/shared'

type OperationClassification = {
  isQuery: boolean
  isMutation: boolean
}

type ClassifyOperationParams = {
  query: ResolvedOptions['query']
  mutation: ResolvedOptions['mutation']
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

const requestGroupOrder = ['path', 'query', 'body', 'headers'] as const

/**
 * Builds the object literal that resolves each request group to a concrete value, unwrapping a getter
 * once before the value reaches the plain `queryKey`/`queryOptions` helpers. A getter must never reach a
 * React Query key, which is hashed structurally. Returns `null` when the operation carries no request group.
 *
 * @example
 * ```ts
 * buildResolvedRequestParams(node) // { path: typeof path === 'function' ? path() : path }
 * ```
 */
export function buildResolvedRequestParams(node: ast.OperationNode): string | null {
  const groups = getRequestGroups(node)
  const names = requestGroupOrder.filter((key) => groups[key])
  if (names.length === 0) return null
  return `{ ${names.map((name) => `${name}: typeof ${name} === 'function' ? ${name}() : ${name}`).join(', ')} }`
}

/**
 * Classifies an operation as a query or a mutation from the resolved `query` / `mutation` method lists.
 * `query: false` still marks the operation as a query so the query-family generators keep matching it,
 * and a method already claimed by `query` never counts as a mutation.
 */
export function classifyOperation(node: ast.HttpOperationNode, { query, mutation }: ClassifyOperationParams): OperationClassification {
  const isQuery = query === false || (!!query && query.methods.some((method) => node.method.toLowerCase() === method.toLowerCase()))
  const queryMethods = new Set(query ? query.methods : [])
  const isMutation =
    mutation !== false &&
    !isQuery &&
    (mutation ? mutation.methods : []).some((method) => !queryMethods.has(method) && node.method.toLowerCase() === method.toLowerCase())

  return { isQuery, isMutation }
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
