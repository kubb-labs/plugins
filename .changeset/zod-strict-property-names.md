---
'@kubb/plugin-zod': patch
---

Print `z.strictObject({})` for an object with `additionalProperties: false` and `propertyNames` but no properties. It used to print a permissive `z.record(keys, z.unknown())`.
