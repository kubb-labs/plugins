/** Adds `queryKey` without writing to `query`, which is TanStack's snapshot; writing to it can loop renders. */
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
