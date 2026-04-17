---
"@kubb/plugin-cypress": major
---

**Breaking:** Upgrade to v5 architecture.

- Uses `@kubb/ast` + `@kubb/core` instead of `@kubb/plugin-oas` / `@kubb/oas`
- Generator receives `{ node, adapter, options, config, driver, resolver }` props
- Add `compatibilityPreset`, `resolver`, and `transformer` options
- `paramsCasing` consistently applied to path, query, and header parameters
