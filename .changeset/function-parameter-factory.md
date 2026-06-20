---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-client": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-mcp": patch
---

Build grouped `{ path, query, body, headers }` parameters through `ast.factory.createFunctionParameter` instead of hand-written `{ kind: 'FunctionParameter' }` node literals, and target `@kubb/ast` `5.0.0-beta.71`. The generated output is unchanged.
