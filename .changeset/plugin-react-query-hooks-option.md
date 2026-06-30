---
"@kubb/plugin-react-query": minor
---

Add `hooks` option to `pluginReactQuery` to skip `use*` hook generation.

Set `hooks: false` to emit only `queryOptions`, `mutationOptions`, `queryKey`, and `mutationKey` helpers — no `useQuery`, `useSuspenseQuery`, `useInfiniteQuery`, `useSuspenseInfiniteQuery`, or `useMutation` functions. The generated output imports only the framework-portable factory functions (`queryOptions`, `infiniteQueryOptions`, `mutationOptions`) that work across all TanStack Query adapters.

Default is `true`; existing outputs are unchanged.

```ts
pluginReactQuery({
  output: { path: 'queries' },
  hooks: false, // generate queryOptions, mutationOptions, and key factories only
})
```
