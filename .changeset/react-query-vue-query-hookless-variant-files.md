---
"@kubb/plugin-react-query": major
"@kubb/plugin-vue-query": major
---

Skip suspense and infinite query files entirely when `hooks` is `false`, and default `pluginReactQuery`'s `suspense` option to `false`.

With `hooks: false` (the default), the suspense and infinite generators still resolved and wrote a file. They only skipped the `use*` hook body, so every query operation got a `Suspense`/`Infinite`-suffixed `queryOptions`/`queryKey` pair with no way to call the hook it was named for. The generators now check `hooks` before resolving a file at all, the same guard `hookOptionsGenerator` already used, so those files stop generating unless you opt into hooks.

`pluginReactQuery`'s `suspense` option now defaults to `false` instead of `{}`, matching `infinite`'s existing off-by-default convention. Combined with the fix above, this also clears the suspense boilerplate for anyone who left `suspense` unset.

**Breaking change:**

- `pluginReactQuery({ suspense: {} })` is required to opt back into suspense query generation; unset `suspense` no longer generates anything.
- Any config with `suspense`, `infinite`, or both set while leaving `hooks` at its default (`false`) stops emitting `<op>SuspenseQueryOptions`, `<op>SuspenseInfiniteQueryOptions`, and `<op>InfiniteQueryOptions` (and their matching query key exports). Set `hooks: true` to keep generating them.
