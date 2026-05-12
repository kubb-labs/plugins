---
"@kubb/plugin-vue-query": patch
---

Internal: deduplicate `wrapOperationParamsWithMaybeRef` and `printType` copies across `Query`, `QueryOptions`, `InfiniteQuery`, `QueryKey`, and `Mutation` by adopting the shared `transformParamTypes` helper from `@internals/tanstack-query`. No user-visible change — generated output is byte-identical.
