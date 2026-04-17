---
"@kubb/plugin-client": major
---

**Breaking:** Rewrite to v5 architecture.

Add `compatibilityPreset` option:
- `'default'` — new v5 naming conventions
- `'kubbV4'` — preserve v4 naming conventions

Add `resolver` option to override individual resolver methods without replacing the entire naming strategy.
