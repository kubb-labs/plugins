---
'@kubb/plugin-faker': patch
---

Faker factories for arrays, tuples, and unions now accept and use their `Partial<T>` override. A
union factory no longer silently drops it under the name `_data`, and array/tuple overrides can
no longer leave an `undefined` hole in the generated value.
