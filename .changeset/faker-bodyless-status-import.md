---
'@kubb/plugin-faker': patch
---

Stop importing the status type for a bodyless response (for example `204`). Its factory returns `undefined` without using the type, so the import failed `noUnusedLocals` (TS6196).
