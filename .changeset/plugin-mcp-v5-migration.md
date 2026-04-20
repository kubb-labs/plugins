---
"@kubb/plugin-mcp": minor
"@kubb/plugin-ts": patch
---

Migrate `@kubb/plugin-mcp` to v5 architecture:

- Add `resolver`, `transformer`, and `printer` options
- Default preset uses individual zod schemas composed into `z.object()`

**Breaking:** Replace `resolvers?: Array<ResolverMcp>` with `resolver?: Partial<ResolverMcp>`. Replace `transformers?: Array<Visitor>` with `transformer?: Visitor`.
