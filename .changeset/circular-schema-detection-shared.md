---
"@kubb/plugin-faker": minor
"@kubb/plugin-zod": minor
---

Fix stack overflows on indirect circular schemas (e.g. `Dog → Pet → Dog`) reported in kubb-labs/kubb#3172.

Both plugins now use shared helpers from `@kubb/ast`:
- `findCircularSchemas(schemas)` — detects all schemas involved in a cycle (direct or indirect)
- `containsCircularRef(node, { circularSchemas, excludeName? })` — checks whether a property transitively references a cyclic schema

**`plugin-faker`**: emits lazy getter syntax (`get archEnemy() { return fakePet() }`) for properties that reference an indirect cycle, preventing stack overflows at construction time. Direct self-references continue to emit `undefined as any`.

**`plugin-zod`**: wraps cyclic `$ref`s in `z.lazy(() => …)` and emits object properties as getters when the property schema references a cyclic schema. The getter body is generated without redundant `z.lazy()` wrappers — eliminated via a closure-level flag rather than post-processing string replacement.
