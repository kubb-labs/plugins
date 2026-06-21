---
"@kubb/plugin-ts": patch
"@kubb/plugin-zod": patch
"@kubb/plugin-faker": patch
---

Sanitize generated identifiers that would otherwise start with a digit so they're valid JavaScript names.

OpenAPI schemas/operations named `409`, `504AccountCancel`, etc. previously produced invalid output like `export const 409Schema = …` and `export interface 409 { … }`. Resolvers in `plugin-ts`, `plugin-zod`, `plugin-client`, and `plugin-faker` now run their PascalCase/camelCase results through a new `ensureValidVarName` helper, which prefixes the name with `_` when it isn't a syntactically valid identifier (leading digit or reserved word). File paths are unaffected.

Reported in kubb-labs/plugins#196.
