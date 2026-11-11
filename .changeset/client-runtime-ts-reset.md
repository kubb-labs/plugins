---
'@kubb/plugin-client': patch
---

The generated `.kubb/core.ts` runtime now type-checks in projects that use `@total-typescript/ts-reset`, which narrows `Array.isArray` to `unknown[]`.
