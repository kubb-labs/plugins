---
"@kubb/plugin-react-query": major
"@kubb/plugin-vue-query": major
---

Add `hooks` option and change the default to `false` for both `pluginReactQuery` and `pluginVueQuery`.

`hooks: false` (the new default) emits only `queryOptions`, `mutationOptions`, `queryKey`, and `mutationKey` helpers — no `useQuery`, `useInfiniteQuery`, `useSuspenseQuery`, `useSuspenseInfiniteQuery`, or `useMutation` functions. The output imports only the framework-portable factory functions (`queryOptions`, `infiniteQueryOptions`, `mutationOptions`) that work across all TanStack Query adapters.

Set `hooks: true` to restore the previous behavior and generate `use*` hook/composable functions alongside the helpers.

```ts
// generate queryOptions/mutationOptions/key factories only (new default)
pluginReactQuery({ output: { path: 'queries' } })

// generate use* hooks as well (opt-in)
pluginReactQuery({ output: { path: 'hooks' }, hooks: true })
```

**Breaking change:** existing configs that rely on generated `use*` hooks must add `hooks: true`.
