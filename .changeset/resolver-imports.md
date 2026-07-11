---
"@kubb/plugin-ts": minor
"@kubb/plugin-zod": minor
"@kubb/plugin-faker": minor
---

Resolve schema ref imports through `resolver.imports` instead of the removed `adapter.getImports`. Generated output is unchanged; this release requires the matching `@kubb/core` with `resolver.imports` and an adapter that publishes `meta.nameMapping`.
