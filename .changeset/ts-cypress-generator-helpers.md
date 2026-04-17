---
"@kubb/plugin-ts": patch
"@kubb/plugin-cypress": patch
---

Refactor `install()` to use new `runGeneratorSchema`, `runGeneratorOperation`, and `runGeneratorOperations` helpers, eliminating repeated resolve → null-check → dispatch boilerplate.
