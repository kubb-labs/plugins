---
'@kubb/plugin-faker': patch
---

Fix mocks for a union whose discriminator property is optional. Each branch now narrows with `Extract<T, { key?: value }>`, so the mock no longer resolves to `never` and fails with TS2322.
