---
"@kubb/plugin-client": patch
"@kubb/plugin-cypress": patch
"@kubb/plugin-mcp": patch
"@kubb/plugin-msw": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-zod": patch
---

Adopt `@kubb/ast`'s `HttpOperationNode` union. Each operation generator narrows the incoming node with `ast.isHttpOperationNode` (HTTP-only plugins), and shared helpers/components accept `ast.HttpOperationNode`, so `method`/`path` are non-nullable without manual assertions. OpenAPI output is unchanged.
