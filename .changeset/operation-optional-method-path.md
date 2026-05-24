---
"@kubb/plugin-client": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-msw": patch
"@kubb/plugin-cypress": patch
"@kubb/plugin-mcp": patch
"@kubb/plugin-zod": patch
---

Handle the now-optional `OperationNode.method`/`path` from `@kubb/ast` (generalized so non-HTTP specs map onto the same node). The client and query generators guard these accesses (`node.method?.toLowerCase()`, `new URLPath(node.path ?? '')`, etc.). For OpenAPI operations `method`/`path` are always present, so generated output is unchanged. Pairs with the `@kubb/ast` node-vocabulary change.
