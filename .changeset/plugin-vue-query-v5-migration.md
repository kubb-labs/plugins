---
"@kubb/plugin-vue-query": major
---

**Breaking:** Rewrite to v5 architecture.

- Plugin rewritten to use `definePlugin`, hook-style generators, and shared `@internals/tanstack-query` package
- No longer depends on `pluginOas()` — use `adapterOas()` in the `adapter` field instead
- `transformers.name` callback replaced by `resolver` option

Add `compatibilityPreset` option:
- `'default'` — new v5 naming conventions
- `'kubbV4'` — preserve v4 naming conventions

Add `resolver` option to override individual resolver methods without replacing the entire naming strategy.

Add `transformer` option to apply an AST visitor before printing.
