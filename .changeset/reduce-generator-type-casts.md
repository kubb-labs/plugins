---
"@kubb/plugin-zod": patch
"@kubb/plugin-ts": patch
"@kubb/plugin-faker": patch
---

Narrow the OpenAPI adapter through a shared `getOasAdapter` helper instead of an unchecked `as` assertion. When a non-OpenAPI adapter is configured, the zod, TypeScript, and faker generators now throw a clear error naming `adapterOas` rather than silently reading `undefined` options. AST node narrowing in `@kubb/plugin-ts` uses type guards (`ts.isTypeLiteralNode`, `typeof`) in place of casts.
