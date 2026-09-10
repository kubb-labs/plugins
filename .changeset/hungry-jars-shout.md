---
'@kubb/plugin-faker': patch
---

Every overridable faker factory now takes `Partial<T>`. A response that `$ref`s a union or array
schema generates a status factory that forwards its own `Partial<T>` argument, which the target
factory used to reject with `TS2345` because it declared the full type. Union factories also
dropped the override at runtime under the name `_data`; they now merge it into the picked member
when that member is an object, and return it outright otherwise.
