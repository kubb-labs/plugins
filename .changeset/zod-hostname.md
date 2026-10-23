---
'@kubb/plugin-zod': patch
---

Print `z.hostname()` for `format: hostname`. This needs `@kubb/adapter-oas` 5.12.7 or later, which keeps `hostname` as a `string` node with its format. Earlier versions still print `z.url()`.
