---
'@kubb/plugin-zod': patch
---

Enforce the OpenAPI `not` keyword. A value the `not` schema accepts now fails validation through `.refine(...)` (`.check(z.refine(...))` with Zod Mini), and the keywords beside `not` still apply, so `{ type: 'integer', not: { const: 0 } }` accepts any integer except `0`. Before, `not` was dropped from the generated schema.
