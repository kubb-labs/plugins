import { getRequestGroups } from '@internals/shared'
import type { ast } from '@kubb/core'

export { buildQueryKeyParams, resolveOperationOverrides, resolveZodSchemaNames } from '@internals/tanstack-query'
export { buildClientOptionType, buildOperationComments as getComments, buildRequestConfigType, resolveErrorNames, resolveSuccessNames } from '@internals/shared'

const requestGroupOrder = ['path', 'query', 'body', 'headers'] as const

/**
 * Widens a type string to `T | (() => T)` so a generated hook signature accepts either the value or a
 * zero-arg getter. React has no `MaybeRefOrGetter`/`toValue` runtime to import, so the union is inlined
 * rather than referencing a named type.
 */
export function maybeValueOrGetter(type: string): string {
  return `${type} | (() => ${type})`
}

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
