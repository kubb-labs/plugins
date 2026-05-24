---
"@kubb/plugin-client": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
---

Rename the client `parser` option value `'client'` to `false`. The client has no runtime parser — it returns the response cast to the generated TypeScript type — so `false` (no validator) is clearer than `'client'`. `parser: 'zod'` is unchanged.

Migration: replace `parser: 'client'` with `parser: false` (or drop it, since `false` is the default) in `pluginClient`, `pluginReactQuery`, and `pluginVueQuery`.
