---
"@kubb/plugin-react-query": minor
---

Generated query hooks (`useQuery`, `useSuspenseQuery`, `useInfiniteQuery`, `useSuspenseInfiniteQuery`) now accept a value **or** a zero-arg getter for each request group by default, so the path/query/body type widens to `T | (() => T)`. This mirrors `@kubb/plugin-vue-query`'s `MaybeRefOrGetter` and lets signal-based libraries (Preact Signals, MobX, Jotai, Legend State, …) pass `useGetPetById(() => petId.value)` without flattening reactivity at hook-call time.

The getter is resolved once inside the hook before the value reaches `queryKey`/`queryOptions`, so query keys stay plain and hash correctly. Output is unchanged for operations without a request group. No new option — this is the default. Resolves [#140](https://github.com/kubb-labs/plugins/issues/140).
