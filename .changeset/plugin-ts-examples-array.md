---
"@kubb/plugin-ts": minor
---

Emit one `@example` JSDoc line per entry of a schema's `examples` array.

OpenAPI 3.1 carries schema examples as an `examples` array, surfaced on the AST schema node by `@kubb/adapter-oas`. `plugin-ts` renders a `@example` line for each entry.
