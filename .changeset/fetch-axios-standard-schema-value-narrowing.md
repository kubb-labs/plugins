---
"@kubb/plugin-fetch": patch
"@kubb/plugin-axios": patch
---

Fix `validateStandardSchema` failing to typecheck in the generated `standardSchema.ts` when a consumer's `tsconfig.json` sets `"strict": false`.

The function narrowed `StandardSchemaResult` by checking `if (result.issues)` and then read `result.value` on the remaining branch. That narrowing depends on `strictNullChecks`: with `strict: false`, TypeScript keeps treating `result` as the full union after the check, and `value` isn't a property shared by both union members, so the read fails to compile.

```ts
// before
return result.value as TOutput

// after
return (result as { value: TOutput }).value
```

Only the generated `standardSchema.ts` changes, so regenerating produces a one-line diff in existing output without any behavior change.
