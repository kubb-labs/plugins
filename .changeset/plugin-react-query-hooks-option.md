---
"@kubb/plugin-react-query": major
"@kubb/plugin-vue-query": major
---

Add `hooks` option and change the default to `false` for both `pluginReactQuery` and `pluginVueQuery`.

`hooks: false` (the new default) emits only `queryOptions`, `mutationOptions`, `queryKey`, and `mutationKey` helpers. The `useQuery`, `useInfiniteQuery`, `useSuspenseQuery`, `useSuspenseInfiniteQuery`, and `useMutation` functions are not generated. The factory functions (`queryOptions`, `infiniteQueryOptions`, `mutationOptions`) work across all TanStack Query adapters.

Set `hooks: true` to restore the previous behavior and generate `use*` hook/composable functions alongside the helpers.

```ts
// generate queryOptions/mutationOptions/key factories only (new default)
pluginReactQuery({ output: { path: 'queries' } })

// generate use* hooks as well (opt-in)
pluginReactQuery({ output: { path: 'hooks' }, hooks: true })
```

**Breaking change:** existing configs that rely on generated `use*` hooks must add `hooks: true`.
