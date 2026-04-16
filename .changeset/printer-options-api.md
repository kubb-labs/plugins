---
"@kubb/plugin-ts": minor
"@kubb/plugin-zod": minor
"@kubb/plugin-cypress": minor
---

Add `printer.nodes` option to override output for individual schema types.

**`@kubb/plugin-ts`:**
```typescript
pluginTs({
  printer: {
    nodes: {
      integer() {
        return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BigIntKeyword)
      },
    },
  },
})
```

**`@kubb/plugin-zod`:**
```typescript
pluginZod({
  printer: {
    nodes: {
      integer() {
        return 'z.number()'
      },
    },
  },
})
```

**Breaking:** Replace `resolvers?: Array<Resolver>` with `resolver?: Partial<Resolver>`. Replace `transformers?: Array<Visitor>` with `transformer?: Visitor`.
