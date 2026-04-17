---
"@kubb/plugin-ts": patch
---

Fix `minItems`/`maxItems` on arrays incorrectly emitting `@minLength`/`@maxLength` JSDoc instead of `@minItems`/`@maxItems`.
