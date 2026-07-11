---
"@kubb/plugin-ts": minor
"@kubb/plugin-zod": minor
"@kubb/plugin-faker": minor
---

Resolve schema ref imports through `resolver.imports` and ref names through `resolveRefName` instead of the removed `adapter.getImports` and `nameMapping` printer options. Generated output is unchanged; this release requires the matching `@kubb/core` and `@kubb/adapter-oas` that ship `resolver.imports` and stamp `targetName` on collision-renamed refs.
