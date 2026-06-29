---
"@kubb/plugin-zod": patch
---

Emit `.default(...)` values that match the generated schema's type. A `bigint` field (`format: int64`) carries a numeric default and some specs put `default: {}` on an array, both of which produced a Zod schema that did not typecheck. Numeric defaults on `bigint` schemas are now emitted as `BigInt(...)` literals, array defaults are emitted as array literals (a non-array default is dropped), and array defaults are no longer collapsed to `{}`.
