---
'@kubb/plugin-ts': patch
---

A binary property, such as a file field in a `multipart/form-data` body, now has a JSDoc note: pass a `File` to send its filename, since a plain `Blob` is sent with the filename `blob`. A binary schema also no longer gets `@type string` in its JSDoc, which contradicted its `Blob` type.
