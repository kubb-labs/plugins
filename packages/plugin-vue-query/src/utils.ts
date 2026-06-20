import { getRequestGroups } from '@internals/shared'
import type { ast } from '@kubb/core'

export { buildQueryKeyParams, resolveOperationOverrides, resolveZodSchemaNames } from '@internals/tanstack-query'
export {
  buildClientOptionType,
  buildOperationComments as getComments,
  buildRequestConfigType,
  buildStatusUnionType,
  getContentTypeInfo,
  resolveErrorNames,
  resolveStatusCodeNames,
  resolveSuccessNames,
} from '@internals/shared'

/**
 * Wraps a type string in `MaybeRefOrGetter<…>` so a vue-query signature accepts refs or getters.
 */
export function maybeRefOrGetter(type: string): string {
  return `MaybeRefOrGetter<${type}>`
}

const requestGroupOrder = ['path', 'query', 'body', 'headers'] as const

/**
 * Builds the argument list for the generated client call inside a vue-query `queryFn`. Each grouped
 * option the operation carries is unwrapped with `toValue()` (refs and getters resolve to their
 * value), and the trailing `config` forwards the abort `signal`. Building the call from the
 * operation's groups keeps it independent of how the parameter binding prints.
 */
export function buildVueClientCallArgs(node: ast.OperationNode): string {
  const groups = getRequestGroups(node)
  const names = requestGroupOrder.filter((key) => groups[key])
  const groupedArg = names.length > 0 ? `{ ${names.map((name) => `${name}: toValue(${name})`).join(', ')} }` : null

  return [groupedArg, '{ ...config, signal: config.signal ?? signal }'].filter(Boolean).join(', ')
}

/**
 * Builds the call to a slim client `<op>` function inside a vue-query composable body. The slim
 * function takes a single grouped options object, so `config` is spread first, then the operation's
 * request groups are unwrapped with `toValue()` (matching {@link buildVueClientCallArgs}), then the
 * abort `signal` for queries, with `throwOnError: true` pinned last so a caller's config can't flip
 * the query's error semantics. Mutations omit the `signal`.
 */
export function buildVueSlimClientCall(node: ast.OperationNode, options: { clientName: string; signal?: boolean }): string {
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
