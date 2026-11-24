---
'@kubb/plugin-react-query': patch
---

Stop generated query hooks from writing `queryKey` onto the TanStack Query result. With an inline `select` that returns a `Map` or class instances, that write made React re-render until it threw `Maximum update depth exceeded` on `@tanstack/react-query` 5.107 and later. Hooks now return `withQueryKey(queryResult, queryKey)`, a helper written to `.kubb/withQueryKey.ts` that adds `queryKey` without changing the result and keeps TanStack's tracking of the properties a component reads.
