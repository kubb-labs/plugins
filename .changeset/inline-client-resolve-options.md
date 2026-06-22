---
"@kubb/plugin-axios": patch
"@kubb/plugin-fetch": patch
---

Inline the option defaults in each client plugin instead of sharing the `resolveOptions` helper from `@internals/client`, matching how `@kubb/plugin-ts` and `@kubb/plugin-zod` resolve their options. Generated output is unchanged.
