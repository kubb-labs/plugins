---
"@kubb/plugin-msw": patch
---

State in the README that the generated handlers need MSW 3. They import from `msw/http`, which MSW 2 does not have, so TypeScript fails with `TS2307: Cannot find module 'msw/http'`.
