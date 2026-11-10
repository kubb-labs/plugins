---
'@kubb/plugin-faker': patch
---

Generate mocks that pass the Zod schema of the same value and can be serialized.

- Keep an `int32` or `uint32` inside its 32-bit range, and an `int64` inside its `minimum` and `maximum`.
- Mock a binary value as a `Blob` instead of a URL string cast to `Blob`.
- Keep a string or a list within 100 of its minimum length. A `maxLength` of 10 MB gave a 10 MB string.
- Leave a reference back into its own cycle empty: an array is `[]` and any other value `undefined`. A mock of two schemas that reference each other overflowed the stack in `JSON.stringify`.
