---
'@kubb/plugin-zod': patch
'@kubb/plugin-ts': patch
---

Keep object defaults from the spec instead of dropping their contents.

- `@kubb/plugin-zod` emits the full object in `.default(...)` and in `.meta({ examples })`, where it emitted `{}` before.
- `@kubb/plugin-ts` writes object and array defaults as JSON in the `@default` tag, where it wrote `[object Object]` or nothing.

```typescript
// Before
output: outputSchema.optional().default({})

// After
output: outputSchema.optional().default({"path":"types"})
```
