---
'@kubb/plugin-faker': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
---

Read `ctx.meta.circularNames` and `ctx.meta.enumNames` as the sets kubb now provides, instead of building a set per build through `ctx.memo`. The `kubb` peer range is now `^5.16.0`, the first release where these fields are `ReadonlySet<string>`.
