---
"@kubb/plugin-ts": patch
"@kubb/plugin-zod": patch
"@kubb/plugin-faker": patch
---

Drop repeated members from union types and schemas, so `oneOf: [string, string, number]` prints `string | number` instead of `string | string | number`.
