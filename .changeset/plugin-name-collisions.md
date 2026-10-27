---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
---

Use Kubb 5.15 name allocation to avoid duplicate exports when operation types, Zod schemas, or Faker factories collide with component names, and when separate TypeScript schemas contain identically named inline enums.
