---
"@kubb/plugin-zod": minor
---

Add `patternProperties` support to the Zod printer. Objects that declare `patternProperties` now emit a `.catchall(...)` built from the first pattern's value schema, mirroring the index signature the TypeScript plugin already generates. `additionalProperties` still takes precedence when both are present.
