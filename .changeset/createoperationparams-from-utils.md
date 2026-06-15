---
"@kubb/plugin-client": patch
"@kubb/plugin-cypress": patch
"@kubb/plugin-mcp": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-vue-query": patch
---

Import `createOperationParams` from `@kubb/ast/utils` instead of `ast.factory`. The helper moved off the `@kubb/ast` factory namespace because it is a high-level builder, not a `ts.factory` primitive. Generated output is unchanged.
