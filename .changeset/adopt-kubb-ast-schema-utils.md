---
'@kubb/plugin-faker': patch
'@kubb/plugin-ts': patch
---

Use `@kubb/ast`'s `resolveSchemaProperties` and `getSchemaLiteralValues` (via `kubb/kit`'s `ast` namespace) instead of hand-rolled traversal for enum literal values and discriminator resolution. No output change: `getDiscriminatorValue` in `plugin-faker` now also resolves a discriminator through a `$ref` to an enum, which the old code did not follow.
