---
"@kubb/plugin-zod": patch
---

Share the traversal and formatting logic between `printerZod` and `printerZodMini` in a single `printers/shared.ts` module, parameterized by a `ZodDialect` that carries the few emissions where the chainable and `zod/mini` APIs differ. Generated output is unchanged; a fix applied to the shared traversal now reaches both printers instead of silently missing one (kubb-labs/plugins#674).
