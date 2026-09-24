---
'@kubb/plugin-zod': patch
---

Resolve `$ref` schemas when computing `default` literals and keep array defaults as array literals.

`defaultLiteral` now resolves `$ref` schema targets so that array, bigint, and enum default formatting guards apply to referenced schemas. In addition, `formatDefault` preserves array literals instead of collapsing them to `{}`.
