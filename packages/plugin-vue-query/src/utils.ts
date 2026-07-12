import { buildClientCall } from '@internals/tanstack-query'
import type { ast } from 'kubb/kit'

export { maybeRefOrGetter } from '@internals/tanstack-query'
export { buildClientOptionType, buildOperationComments as getComments, buildRequestConfigType } from '@internals/shared'

/**
 * Unwraps a request group in generated vue-query code, keeping the ref/getter live and resolving it
 * lazily with `toValue`. Shared by the client call and the infinite-query options component so the
 * convention stays defined in one place.
 */
export function unwrapWithToValue(name: string): string {
  return `toValue(${name})`
}

/**
 * Builds the call to a contract client `<op>` function inside a vue-query composable body. The
 * function takes a single grouped options object, so `config` is spread first, then the operation's
 * request groups are unwrapped with `toValue()`, then the abort `signal` for queries, with
 * `throwOnError: true` pinned last so a caller's config can't flip the query's error semantics.
 * Mutations omit the `signal`.
 */
export function buildVueClientCall(node: ast.OperationNode, options: { clientName: string; signal?: boolean }): string {
  return buildClientCall(node, { ...options, unwrapName: unwrapWithToValue })
}
