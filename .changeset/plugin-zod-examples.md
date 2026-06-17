---
"@kubb/plugin-zod": minor
---

Emit `.meta({ examples: [...] })` for schemas that carry examples.

OpenAPI examples are surfaced on the AST schema node by `@kubb/adapter-oas`. The Zod plugin now renders them through the Zod v4 `.meta()` metadata API, alongside the existing `.describe()` and `.default()` chain.
