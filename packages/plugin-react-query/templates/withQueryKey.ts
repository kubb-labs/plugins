/**
 * Returns `query` with `queryKey` added, without writing to `query`.
 *
 * TanStack Query keeps the hook result as its current snapshot. Assigning to it changes that snapshot,
 * and in some cases React re-renders until it throws `Maximum update depth exceeded`. Every other
 * property is a getter that reads `query`, so TanStack still tracks which properties a component reads.
 */
export function withQueryKey<T extends object, K>(query: T, queryKey: K): T & { queryKey: K } {
  const result = { queryKey }

  for (const key of Object.keys(query)) {
    if (key === 'queryKey') continue
    Object.defineProperty(result, key, {
      enumerable: true,
      configurable: true,
      get: () => Reflect.get(query, key),
    })
  }

  return result as T & { queryKey: K }
}
