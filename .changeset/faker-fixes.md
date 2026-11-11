---
'@kubb/plugin-faker': patch
---

Generate mocks that compile, pass the Zod schema of the same value, and can be serialized.

- `create<Operation>Response` picks among the success responses only, like the `<Operation>Response` type.
- Numbers keep to `multipleOf`, an `int32` or `uint32` to its 32-bit range, and an `int64` to its `minimum`, `maximum` and exclusive bounds.
- Strings get `ipv4`, `ipv6`, `jwt`, `ulid`, `iban`, `duration` and `hostname` values, and a `pattern` with `\d`, `\w`, escaped characters or `{1,}` gives a matching value. A string or list stays within 100 of its minimum length.
- Objects keep to `minProperties` and `maxProperties`, a `uniqueItems` array has no duplicates, and a binary value is a `Blob`.
- `allOf` and `oneOf`: a literal an `allOf` member sets wins over its base, a discriminated `oneOf` with sibling properties keeps its discriminator, and an enum inside a narrowing `allOf` or `oneOf` compiles.
- Cycles: schemas that reference each other, such as `And`, `Or` and `Not` filters, no longer overflow the stack. A discriminated `oneOf` picks a variant outside the cycle, and a reference back into the cycle is left empty.
