---
"@kubb/plugin-zod": minor
"@kubb/plugin-faker": minor
---

Assemble generated object schemas with the shared `ast.buildObject` helper so they read cleanly before any formatter runs. Object properties now use two-space indentation, a closing brace aligned with the declaration, unquoted keys when they are valid identifiers, and trailing commas. Requires the `@kubb/ast` release that adds `buildObject`/`objectKey`.
