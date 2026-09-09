---
'@kubb/plugin-faker': patch
'@kubb/plugin-ts': patch
---

Read enum literals through `@kubb/ast`'s `getSchemaLiteralValues` and resolve discriminator properties with `resolveSchemaProperties`. A `oneOf` variant whose discriminator is a `$ref` to a single-value enum now narrows to its own branch instead of keeping the whole union.
