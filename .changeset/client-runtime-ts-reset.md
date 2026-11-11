---
'@kubb/plugin-client': patch
---

The client runtime copied into `.kubb/core.ts` now type-checks in projects that use `@total-typescript/ts-reset`. `headerEntries` relied on `Array.isArray` narrowing to `any[]`, which ts-reset changes to `unknown[]`.
