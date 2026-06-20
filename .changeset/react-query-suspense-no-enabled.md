---
"@kubb/plugin-react-query": patch
---

Don't emit an `enabled` guard in generated suspense query options.

`useSuspenseQuery`/`useSuspenseInfiniteQuery` always run, and TanStack Query
types `UseSuspenseQueryOptions` as `Omit<UseQueryOptions, 'enabled' | ...>`, so
an `enabled` option is invalid for suspense hooks. The generated
`<op>SuspenseQueryOptions` and `<op>SuspenseInfiniteQueryOptions` functions no
longer include `enabled`. Regular `useQuery`/`useInfiniteQuery` options drop the
auto guard too and instead require the spec-required params at the type level.
