---
"@kubb/plugin-ts": minor
---

Add `resolvers` and `transformers` options for customizing naming conventions and AST transformations:

- `resolvers` — array of named resolvers that control naming conventions (later entries override earlier ones)
- `transformers` — array of AST `Visitor` objects applied to each `SchemaNode` before printing

Built-in resolvers: `resolverTs` (default) and `resolverTsLegacy`.

**Breaking:** Remove the old `transformers: { name? }` object option. Use a custom resolver in `resolvers` instead.
