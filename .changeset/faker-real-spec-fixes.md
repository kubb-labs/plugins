---
'@kubb/plugin-faker': patch
---

Generate mocks that compile, pass the Zod schema of the same value, and can be serialized.

- `create<Operation>Response` picks among the success responses only, like the `<Operation>Response` type. It used to return error bodies too.
- Compile an enum inside an `allOf` or `oneOf` that narrows it, and an array next to an object in a `oneOf`.
- Keep an `int32` or `uint32` inside its 32-bit range, and an `int64` inside its `minimum` and `maximum`.
- Mock a binary value as a `Blob` instead of a URL string cast to `Blob`.
- Keep a string or a list within 100 of its minimum length, and leave a reference back into its own cycle empty. A 10 MB `maxLength` gave a 10 MB string, and two schemas that reference each other overflowed the stack in `JSON.stringify`.
