---
"@kubb/plugin-zod": patch
---

Emit `z.literal`/`z.union` instead of `z.enum` for non-string `const`/enum values. `z.enum()` only accepts string members in Zod v4, so a numeric, boolean, or mixed set produced a type error (TS2769). All-string sets keep the compact `z.enum([…])`.
