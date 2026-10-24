---
'@kubb/plugin-ts': minor
---

Add `zod: true` to alias each operation's param, request body, and status types to the `@kubb/plugin-zod` inferred types, so clients and query hooks typed by `@kubb/plugin-ts` take a codec's domain value.

```typescript
pluginTs({ zod: true })
pluginZod({ inferred: 'direction' })
```
