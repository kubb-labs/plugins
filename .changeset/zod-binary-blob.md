---
'@kubb/plugin-zod': patch
---

A binary field's schema is now `z.instanceof(Blob)` instead of `z.instanceof(File)`, matching its `Blob` type from `@kubb/plugin-ts`. A plain `Blob` body, such as an `application/octet-stream` upload, no longer fails `validator: 'zod'`. A `File` still passes, since a `File` is a `Blob`.

The inferred type of such a schema changes from `File` to `Blob`. If your code reads `.name` or another `File` property on a parsed value, check `value instanceof File` first.
