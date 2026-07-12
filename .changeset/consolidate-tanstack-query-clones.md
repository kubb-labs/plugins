---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-mcp": patch
---

Consolidate the shared TanStack Query internals into `@internals/tanstack-query`. The `infiniteQueryOptions` assembly, the react-query suspense variants, and the repeated `plugin.ts` option-resolution blocks now live in one place instead of being copied across react-query, vue-query, and swr. Generated output is unchanged.
