---
"@kubb/plugin-vue-query": patch
---

Restore v4-style `queryKey` and `mutationKey` transformer compatibility in `@kubb/plugin-vue-query`.

Custom key transformers now receive the v5 `node` field and a v4-compatible `{ operation, schemas }` shape so existing callbacks using `props.operation.getOperationId()` and `QueryKey.getTransformer(props)` continue to work during migration.
