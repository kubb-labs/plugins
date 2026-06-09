---
"@kubb/plugin-zod": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
---

Assemble generated schemas and query options so they read cleanly before any formatter runs. Object schemas use the shared `ast.buildObject` helper (two-space indentation, closing brace at column zero, unquoted keys when valid, trailing commas), and `z.union`/`z.discriminatedUnion`/`z.tuple` use `ast.buildList` so object members nest one level deeper instead of sitting inline. The infinite-query option bodies in `@kubb/plugin-react-query` and `@kubb/plugin-vue-query` are re-authored with consistent two-space indentation so their options no longer drop to column zero. Requires the `@kubb/ast` release that adds `buildObject`/`buildList`/`objectKey`.
