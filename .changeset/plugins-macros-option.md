---
"@kubb/plugin-cypress": major
"@kubb/plugin-faker": major
"@kubb/plugin-mcp": major
"@kubb/plugin-msw": major
"@kubb/plugin-react-query": major
"@kubb/plugin-swr": major
"@kubb/plugin-ts": major
"@kubb/plugin-vue-query": major
"@kubb/plugin-zod": major
---

Replace the `transformer` option with `macros`.

Every plugin now takes `macros?: Array<ast.Macro>` instead of `transformer?: ast.Visitor`, and registers them with `ctx.setMacros` in `kubb:plugin:setup`. Macros are named and composable, so a list runs in order and a later macro sees the output of an earlier one. Move a single visitor into a macro by wrapping it: `macros: [{ name: 'my-macro', schema(node) { … } }]`.
