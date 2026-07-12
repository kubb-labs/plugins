import { InfiniteQueryOptions as BaseInfiniteQueryOptions } from '@internals/tanstack-query'
import type { ast } from 'kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { KubbReactNode } from 'kubb/jsx'
import type { Infinite } from '../types.ts'
import { maybeRefOrGetter, unwrapWithToValue } from '../utils.ts'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  initialPageParam: Infinite['initialPageParam']
  cursorParam: Infinite['cursorParam']
  nextParam: Infinite['nextParam']
  previousParam: Infinite['previousParam']
  queryParam: Infinite['queryParam']
}

/**
 * The vue-query flavor of the shared `infiniteQueryOptions` component: request groups accept
 * `MaybeRefOrGetter` values, are unwrapped with `toValue(...)` in the client call, and the emitted
 * `TQueryKey` generic is the imported `QueryKey` type instead of `typeof queryKey`.
 */
export function InfiniteQueryOptions(props: Props): KubbReactNode {
  return <BaseInfiniteQueryOptions {...props} queryKeyType="QueryKey" memberTypeWrapper={maybeRefOrGetter} unwrapName={unwrapWithToValue} />
}
