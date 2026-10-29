---
'@kubb/plugin-axios': patch
'@kubb/plugin-client': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-zod': patch
---

Compute build-constant work once per build through `memo` instead of once per schema or operation node: the Zod printers, the operation type source a client or hook takes its types from, the `TData` and `TError` expressions of each hook, and the circular and enum name sets. Each key prefix is registered in `Kubb.MemoRegistry`.
