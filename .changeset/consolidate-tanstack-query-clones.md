---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-mcp": patch
---

Consolidate the TanStack Query component clones into `@internals/tanstack-query`. The `infiniteQueryOptions` assembly now lives in one shared component, parameterized where the frameworks genuinely differ: react-query resolves getters once at the hook boundary, vue-query accepts `MaybeRefOrGetter` values and unwraps them with `toValue(...)`. The react-query suspense components fold into their base `Query` and `InfiniteQuery` components behind a `suspense` option, and the repeated `query`/`mutation`/`infinite` option-resolution and contract-client blocks in each `plugin.ts` move into shared helpers. Generated output is unchanged.
