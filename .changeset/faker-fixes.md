---
'@kubb/plugin-faker': patch
---

Generate mocks that compile and pass the Zod schema of the same value.

- Pick among the success responses only in `create<Operation>Response`.
- Keep numbers inside `multipleOf`, their `int32`, `uint32` or `int64` range, and exclusive bounds.
- Give `ipv4`, `ipv6`, `jwt`, `ulid`, `iban`, `duration` and `hostname` strings a matching value, and read `\d`, `\w` and `{1,}` in a `pattern`.
- Keep objects inside `minProperties` and `maxProperties`, and a `uniqueItems` array free of duplicates.
- Stop overflowing the stack on schemas that reference each other, such as `And`, `Or` and `Not` filters.
