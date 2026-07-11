import { getRequestGroups } from '@internals/shared'
import type { ast } from 'kubb/kit'

export { maybeRefOrGetter } from '@internals/tanstack-query'
export { buildClientOptionType, buildOperationComments as getComments, buildRequestConfigType, resolveErrorNames, resolveSuccessNames } from '@internals/shared'

const requestGroupOrder = ['path', 'query', 'body', 'headers'] as const

/**
 * Builds the call to a contract client `<op>` function inside a vue-query composable body. The
 * function takes a single grouped options object, so `config` is spread first, then the operation's
 * request groups are unwrapped with `toValue()`, then the abort `signal` for queries, with
 * `throwOnError: true` pinned last so a caller's config can't flip the query's error semantics.
 * Mutations omit the `signal`.
 */
export function buildVueClientCall(node: ast.OperationNode, options: { clientName: string; signal?: boolean }): string {
  const { clientName, signal = false } = options
  const groups = getRequestGroups(node)
  const names = requestGroupOrder.filter((key) => groups[key])

  const args = [
    '...config',
    ...names.map((name) => `${name}: toValue(${name})`),
    signal ? 'signal: config.signal ?? signal' : null,
    'throwOnError: true',
  ].filter((part): part is string => part !== null)

  return `${clientName}({ ${args.join(', ')} })`
}
