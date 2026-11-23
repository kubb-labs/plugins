---
'@kubb/plugin-zod': patch
---

Import a schema's `Input` variant when a macro renamed that schema. A schema with a read-only, write-only or codec field gets an `...InputSchema` variant. A schema that refers to it now imports that variant, even when the document only knows the schema by its old name.
