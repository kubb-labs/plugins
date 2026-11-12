---
'@kubb/plugin-zod': patch
---

Checking whether a schema needs an input variant now reuses earlier answers for the rest of the build, which cuts about 11 s of CPU on the Microsoft Graph spec.
