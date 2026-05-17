---
"@kubb/plugin-vue-query": patch
---

Fix `enabled` flag to unwrap `MaybeRefOrGetter` params using `toValue()`.

The `enabled` option in generated `queryOptions` and `infiniteQueryOptions` now correctly wraps each required parameter with `!!toValue(param)` instead of a plain `!!param` check. This ensures reactive refs and getter functions are properly resolved before evaluating whether a query should be enabled.
