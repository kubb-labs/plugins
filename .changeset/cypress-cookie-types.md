---
'@kubb/plugin-cypress': patch
---

Fix a type error in requests whose cookies are all strings. The generated cookie encoder now reads each value as `unknown`, so `value instanceof Date` compiles, also when plugin-ts emits the cookie params as an interface.
