---
'@kubb/plugin-zod': patch
---

Fix `compile: { strict: true }` generating modules that throw `ZodCompileUnsupportedError` on import. A schema that Zod cannot compile, such as a coerced `int64` parameter, a `z.xor`, or one that reaches a circular schema through a `$ref`, is now left uncompiled.
