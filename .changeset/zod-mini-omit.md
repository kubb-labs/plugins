---
'@kubb/plugin-zod': patch
---

With `mini: true`, emit `z.omit(schema, mask)` for `readOnly` / `writeOnly` keys instead of `.omit()`, and reach a nullable or optional `$ref` through `._zod.def.innerType` instead of `.unwrap()`. Zod Mini schemas have neither method, so the generated code failed to typecheck and threw at load.
