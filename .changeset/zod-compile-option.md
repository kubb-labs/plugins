---
'@kubb/plugin-zod': minor
---

Add `compile` option to compile generated schemas with `z.compile(...)` for faster runtime validation.

When `compile: true` or `compile: { strict: true }` is enabled, schemas are wrapped in `z.compile(...)`, leveraging Zod v4.5's hyperoptimized fast-path validation logic. Passing `{ strict: true }` enforces that schemas compile into flat JavaScript without silently falling back to the standard interpreter. Schemas with circular references or bare `$ref` aliases are automatically guarded and left uncompiled. Compatible with Zod v4.5.0 or above.
