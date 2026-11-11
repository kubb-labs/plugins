---
'@kubb/plugin-zod': patch
---

Members of a `z.discriminatedUnion` are no longer strict, so an OpenAPI 3.2 Server-Sent Events item accepts the standard `id` and `retry` fields. A discriminated `oneOf` with sibling properties keeps its discriminator literal instead of widening it to `z.string()`.
