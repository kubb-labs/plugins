---
"tests-3.0.x": patch
---

Fix typecheck errors in the 3.0.x test suite by adding `storage: memoryStorage()` to every `BuildConfig` object.

The `Config` type now requires a `storage` field; all test configs in `tests/3.0.x` are updated to satisfy this constraint. Also fixes the `memorStorage` typo in `pluginVueQuery.test.ts`.
