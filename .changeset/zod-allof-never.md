---
'@kubb/plugin-zod': patch
---

An `allOf` Zod schema whose members share no enum value for a property now prints `z.never()` for it, like `never` in the TypeScript type. Before, it kept the later member's enum and accepted values the type rejects.
