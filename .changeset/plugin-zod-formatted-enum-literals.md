---
'@kubb/plugin-zod': patch
---

Print an enum that has a `format` like other enums. String values print as one `z.enum([...])` instead of a union of single-value enums, and numeric values keep accepting numeric strings under `coercion` through `z.coerce.number().pipe(...)`.
