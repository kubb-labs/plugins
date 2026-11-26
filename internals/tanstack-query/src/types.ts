import type { ast } from '@internals/ast'
import type { ReturnTypeOption } from '@internals/client'

export type ParamsCasing = 'camelcase' | undefined

/**
 * The hook plugin's `returnType`, `'data'` when unset, and whether the client's results carry typed response headers.
 */
export type HookResultProps = { returnType: ReturnTypeOption; typedHeaders?: boolean }

/** Adds the client plugin's own `returnType`, which decides how the client call is unwrapped. */
export type CallReturnTypeProps = HookResultProps & { clientReturnType: ReturnTypeOption }

/**
 * The hook a key is built for. Plain and suspense queries can share a key, but an infinite query
 * caches `InfiniteData` and must never share one with a plain query.
 */
export type KeyVariant = 'query' | 'suspenseQuery' | 'infiniteQuery' | 'suspenseInfiniteQuery' | 'mutation'

export type KeyTransformerProps = { node: ast.OperationNode; casing: ParamsCasing; variant: KeyVariant }

/**
 * Builds query or mutation key segments for an operation node.
 * Receives `variant` indicating which hook or composable the key is built for.
 */
export type KeyTransformer = (props: KeyTransformerProps) => Array<unknown>

/** @deprecated Use `KeyTransformer`. Removed in v6. */
export type Transformer = KeyTransformer

/**
 * Configures the query side of a TanStack-family plugin: which HTTP methods produce query
 * hooks and where the query runtime is imported from.
 */
export type QueryConfig = {
  /**
   * HTTP methods treated as queries. Operations using these methods produce
   * `useQuery`-style hooks.
   *
   * @default ['GET', 'QUERY']
   */
  methods?: Array<string>
  /**
   * Module specifier used in the `import { useQuery } from '...'` statement at
   * the top of every generated file. Each plugin defaults this to its own runtime
   * package. Useful for routing through a wrapper that injects a default
   * `queryClient`.
   */
  importPath?: string
}

/**
 * Configures the mutation side of a TanStack-family plugin: which HTTP methods produce
 * mutation hooks and where the mutation runtime is imported from.
 */
export type MutationConfig = {
  /**
   * HTTP methods treated as mutations. Operations using these methods produce
   * `useMutation`-style hooks.
   *
   * @default ['POST', 'PUT', 'PATCH', 'DELETE']
   */
  methods?: Array<string>
  /**
   * Module specifier used in the `import { useMutation } from '...'` statement
   * at the top of every generated file. Each plugin defaults this to its own
   * runtime package.
   */
  importPath?: string
}

export type InfiniteConfig = {
  /**
   * Name of the query parameter that holds the page cursor.
   *
   * @default 'id'
   */
  queryParam?: string
  /**
   * Path to the cursor field on the response. Leave undefined when the cursor
   * is not known.
   *
   * @deprecated Use `nextParam` and `previousParam` for richer pagination control.
   */
  cursorParam?: string | null
  /**
   * Path to the next-page cursor on the response. Supports dot notation
   * (`'pagination.next.id'`) or array form (`['pagination', 'next', 'id']`).
   */
  nextParam?: string | Array<string> | null
  /**
   * Path to the previous-page cursor on the response. Supports dot notation
   * or array form.
   */
  previousParam?: string | Array<string> | null
  /**
   * Initial value for `pageParam` on the first fetch.
   *
   * @default 0
   */
  initialPageParam?: unknown
  /**
   * Whether `initialPageParam` was explicitly configured rather than defaulted.
   * When omitted or false, the default previous page threshold remains 1 (legacy 1-based default).
   */
  hasExplicitInitialPageParam?: boolean
  /**
   * Source of TanStack Query's `getNextPageParam`, inlined verbatim as a function expression. Use it
   * when the next page has to be computed rather than read from a field. Takes precedence over
   * `nextParam` and `cursorParam`.
   *
   * Note: Because functions are inlined verbatim into generated code via `.toString()`, they cannot
   * reference local closures or external variables from the config file.
   *
   * @example
   * `'(lastPage) => (lastPage.hasNext ? lastPage.number + 1 : undefined)'`
   * // or with definePageParam:
   * `definePageParam<MyResponse, number>((lastPage) => (lastPage.hasNext ? lastPage.number + 1 : undefined))`
   */
  getNextPageParam?: string | PageParamFn | null
  /**
   * Source of TanStack Query's `getPreviousPageParam`, inlined verbatim as a function expression.
   * Takes precedence over `previousParam` and `cursorParam`.
   *
   * Note: Because functions are inlined verbatim into generated code via `.toString()`, they cannot
   * reference local closures or external variables from the config file.
   *
   * @example
   * `'(firstPage) => (firstPage.number > 0 ? firstPage.number - 1 : undefined)'`
   * // or with definePageParam:
   * `definePageParam<MyResponse, number>((firstPage) => (firstPage.number > 0 ? firstPage.number - 1 : undefined))`
   */
  getPreviousPageParam?: string | PageParamFn | null
}

// The `any` defaults let a config pass `(lastPage) => lastPage.next` without type arguments. `unknown` would reject that.
// oxlint-disable-next-line typescript/no-explicit-any
export type PageParamFn<TPage = any, TParam = any> = (
  page: TPage,
  allPages: Array<TPage>,
  pageParam: TParam,
  allPageParams: Array<TParam>,
) => TParam | undefined | null

/** Wraps the type of each request group member, such as `MaybeRefOrGetter<T>` in Vue. */
export type MemberTypeWrapper = (type: string) => string
