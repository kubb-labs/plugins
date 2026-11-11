---
'@kubb/plugin-zod': patch
---

Fix two schemas that did not compile.

- Annotate a recursive schema as `z.ZodMiniType` with `mini: true`. `zod/mini` has no `z.ZodType`.
- Drop a spec `default` on a binary schema, since a `Blob` has no literal.
