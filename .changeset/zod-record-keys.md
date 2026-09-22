---
"@kubb/plugin-zod": minor
---

Support `z.record(keySchema, valueSchema)` for OpenAPI dictionaries and `propertyNames`.

- Objects with no declared properties and `additionalProperties: <schema>` now generate `z.record(z.string(), schema)` instead of `z.object({}).catchall(schema)`.
- Support OpenAPI 3.1 `propertyNames` as the key schema argument in `z.record(keySchema, valueSchema)` (for both standard Zod and Zod Mini).
- Objects with declared properties continue using `.catchall(schema)`.
