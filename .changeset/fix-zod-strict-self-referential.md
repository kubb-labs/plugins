---
"@kubb/plugin-zod": patch
---

Emit `z.strictObject({ ... })` instead of `z.object({ ... }).strict()` for `additionalProperties: false`. A schema that references itself defers the self-reference as a property getter, and `.strict()` reads `.shape` eagerly, so it ran that getter while the schema's own `const` was still in the temporal dead zone — the generated module threw `ReferenceError: Cannot access 'X' before initialization` on import, taking the barrel file with it. Same validation, no eager read, and it matches what the Zod Mini printer already emits.
