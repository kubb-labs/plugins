---
'@kubb/plugin-faker': patch
---

Mocks now pass the Zod schema of the same value in more cases: an `int64` mock stays inside exclusive bounds, an object keeps to `maxProperties`, and to `minProperties` when `additionalProperties` has a schema, a `uniqueItems` array has no duplicates, and a discriminated `oneOf` with sibling properties keeps its discriminator value.
