---
'@kubb/plugin-zod': minor
---

Add `compile` option to compile generated schemas with `z.compile(...)` for faster runtime validation.

When `compile: true` is enabled, top-level schemas are wrapped in `z.compile(...)`, leveraging Zod v4.5's hyperoptimized fast-path validation logic. Compatible with Zod v4.5.0 or above.
