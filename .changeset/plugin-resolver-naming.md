---
"@kubb/plugin-cypress": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-mcp": minor
"@kubb/plugin-msw": major
"@kubb/plugin-react-query": major
"@kubb/plugin-vue-query": major
---

Expand plugin resolvers with dedicated naming methods for generated helpers, hooks, keys, handlers, client classes, handler collections, custom hook option helpers, and paths.

**Breaking:** `@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, and `@kubb/plugin-msw` no longer support the `transformers.name` naming option. Use the plugin `resolver` option instead to customize generated names.
