---
'@kubb/plugin-zod': patch
---

Honor `coercion` when `mini: true`. Zod Mini schemas now use `z.coerce.string()`, `z.coerce.number()`, and `z.coerce.date()` like the classic printer, instead of ignoring the option.
