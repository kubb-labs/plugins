---
'@kubb/plugin-zod': patch
---

Fix schemas that did not compile or were too strict.

- Print a tuple with its rest items, so `prefixItems` with `items` gives `z.tuple([a], b)`, and keep a `null` example in `.meta({ examples })`.
- Print `z.union` for a discriminated `oneOf` with a plain-string member, such as a `defaultMapping`, and keep the discriminator literal of one with sibling properties.
- Stop making members of a `z.discriminatedUnion` strict, so a Server-Sent Events item accepts the standard `id` and `retry` fields.
- Annotate a recursive schema as `z.ZodMiniType` with `mini: true`, and keep the bounds of an `int64`.
- Drop a spec `default` on a binary schema, since a `Blob` has no literal.
