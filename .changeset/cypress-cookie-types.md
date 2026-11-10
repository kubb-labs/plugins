---
'@kubb/plugin-cypress': patch
---

Fix a type error in requests whose cookies are all strings. The generated cookie encoder now reads each value as `unknown`, so `value instanceof Date` compiles.
