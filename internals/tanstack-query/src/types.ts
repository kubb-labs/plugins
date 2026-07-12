import type { ast } from 'kubb/kit'

export type ParamsCasing = 'camelcase' | undefined
export type PathParamsType = 'object' | 'inline'
export type ParamsType = 'object' | 'inline'

export type Transformer = (props: { node: ast.OperationNode; casing: ParamsCasing }) => Array<unknown>

/**
 * Configures the query side of a TanStack-family plugin: which HTTP methods produce query
 * hooks and where the query runtime is imported from.
 */
export type Query = {
  /**
   * HTTP methods treated as queries. Operations using these methods produce
   * `useQuery`-style hooks.
   *
   * @default ['GET']
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
export type Mutation = {
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

export type Infinite = {
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
}
