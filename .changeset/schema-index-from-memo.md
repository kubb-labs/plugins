---
'@kubb/plugin-ts': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
---

Build the enum and circular schema name sets from the parsed schemas with `ctx.memo`, instead of reading `ctx.meta.enumNames` and `ctx.meta.circularNames`. This keeps the plugins working once `@kubb/core` drops both fields from `InputMeta`.
