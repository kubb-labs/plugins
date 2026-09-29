---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-mcp': patch
---

Honor the client plugin's per-operation `override`, `include`, and `exclude` when generating hooks and MCP handlers. A `pluginAxios` / `pluginFetch` `override` that changed `returnType`, `output`, or `group` for some operations was ignored by the dependents, which read the client plugin's global options instead. Their generated call body then no longer matched the `<op>` it called, for example a hook treating a full `RequestResult` as the response body. Operations the client plugin excludes are now skipped instead of importing an `<op>` that was never emitted.

```typescript
pluginAxios({
  returnType: 'data',
  // Hooks for getPetById now call `.unwrap()` to match the full result this operation returns
  override: [{ type: 'operationId', pattern: 'getPetById', options: { returnType: 'full' } }],
})
```
