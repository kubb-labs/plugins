---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
---

Avoid duplicate exports when operation types or Zod schemas collide with component names, and when separate TypeScript schemas contain identically named inline enums.
