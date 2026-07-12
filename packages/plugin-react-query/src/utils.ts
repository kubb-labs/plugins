import { getRequestGroups } from '@internals/shared'
import type { ast } from 'kubb/kit'
import type { ResolvedOptions } from './types.ts'

export { buildQueryKeyParams, buildResponseTypes, maybeValueOrGetter, resolveOperationOverrides, resolvePageParamType } from '@internals/tanstack-query'
export { buildClientOptionType, buildOperationComments as getComments, buildRequestConfigType } from '@internals/shared'

type OperationClassification = {
  isQuery: boolean
  isMutation: boolean
}

type ClassifyOperationParams = {
  query: ResolvedOptions['query']
  mutation: ResolvedOptions['mutation']
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
