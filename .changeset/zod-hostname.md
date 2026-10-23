---
'@kubb/plugin-zod': patch
---

Print `z.hostname()` for `format: hostname`. It takes effect once `@kubb/adapter-oas` maps `hostname` to a `string` node (kubb-labs/kubb#4410), which keeps the format. Until then `hostname` prints `z.url()` as before.
