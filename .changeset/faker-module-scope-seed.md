---
'@kubb/plugin-faker': patch
---

Emit `faker.seed(...)` once at module scope instead of inside every generated factory. Nested factory calls (for example, array items generated via `faker.helpers.multiple`) no longer reset the PRNG on every invocation, so repeated calls produce distinct values while output stays deterministic.
