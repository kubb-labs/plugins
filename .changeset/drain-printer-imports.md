---
'@kubb/plugin-ts': patch
'@kubb/plugin-faker': patch
---

A `printer.nodes` handler that calls `this.import(...)` now gets that import in the generated file, as it already did in `@kubb/plugin-zod`. Before, `@kubb/plugin-ts` and `@kubb/plugin-faker` dropped it.
