---
"@kubb/plugin-client": patch
"@kubb/plugin-cypress": patch
"@kubb/plugin-mcp": patch
"@kubb/plugin-msw": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-zod": patch
---

Handle the now-optional `method`/`path` on `@kubb/ast`'s `OperationNode`. These plugins target OpenAPI, where both fields are always present, so they assert the value where a definite `method`/`path` is required. OpenAPI output is unchanged.
