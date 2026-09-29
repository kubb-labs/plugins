---
"@kubb/plugin-zod": minor
---

Support `z.record(keySchema, valueSchema)`, `z.partialRecord(...)`, and `z.looseObject(...)` for OpenAPI objects and dictionaries.

- Objects with no declared properties and `additionalProperties: <schema>` now generate `z.record(z.string(), schema)` instead of `z.object({}).catchall(schema)`.
- Support OpenAPI 3.1 `propertyNames` as the key schema argument in `z.record(keySchema, valueSchema)` (for both standard Zod and Zod Mini).
- Closed key schemas (such as enums and literals) used with `propertyNames` generate `z.partialRecord(keySchema, valueSchema)` so that absent keys do not fail Zod v4 exhaustiveness checks, accurately modeling OpenAPI `propertyNames` semantics and inferring `Partial<Record<Keys, Value>>`.
- Objects with `additionalProperties: true` now generate native `z.looseObject(...)` instead of catchall.
- Objects with declared properties and typed `additionalProperties` continue using `.catchall(schema)`.
