---
"@kubb/plugin-redoc": patch
---

Type `templateOptions` on `getPageHTML` as `Record<string, unknown>` instead of `any`, so the runtime and plugin source stay free of explicit `any`. Generated output is unchanged: a schema typed `any` still emits `any`.
