---
"@kubb/plugin-zod": major
---

Add a combined `{ body, path, query, headers }` options schema per operation, matching the shape `@kubb/plugin-ts`'s `Options` type already has.

With `inferred: true`, each operation now also emits grouped `path`/`query`/`headers` schemas (when that group has parameters) and the combined options schema, backed by a new `resolver.response.options(node)` type name. Nothing changes when `inferred` is left at its default of `false`.

**Breaking change:** `resolver.param.path`, `resolver.param.query`, and `resolver.param.headers` now resolve the name of that grouped schema (e.g. `deletePetPathSchema`) instead of aliasing to the individual parameter's schema name. Anything calling these methods directly, or patching them via `resolver: ResolverPatch<ResolverZod>`, gets the new grouped name. `resolver.param.name(node, param)` is unaffected and still resolves an individual parameter's schema name.
