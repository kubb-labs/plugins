---
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-swr': minor
---

Give infinite queries their own query key and tell custom `queryKey`/`mutationKey` builders which hook the key is for.

- The default infinite query key adds `infinite: true` to its first segment. It previously equalled the plain query's key, so using both hooks for one request stored `InfiniteData` and the plain response under the same cache entry. Invalidating with the plain key still matches the infinite query.
- `queryKey` and `mutationKey` receive `variant` (`'query'`, `'suspenseQuery'`, `'infiniteQuery'`, `'suspenseInfiniteQuery'` or `'mutation'`).
