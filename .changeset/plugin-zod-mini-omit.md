---
'@kubb/plugin-zod': patch
---

Emit functional `z.omit(schema, mask)` rather than method `.omit()` when generating Zod Mini schemas with `keysToOmit`. Zod Mini schemas have no `.omit()` or `.unwrap()` methods; referenced schemas access `._zod.def.innerType` before calling `z.omit()`.
