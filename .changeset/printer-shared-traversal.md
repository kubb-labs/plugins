---
"@kubb/plugin-faker": patch
"@kubb/plugin-ts": patch
"@kubb/plugin-zod": patch
---

Consume the shared schema-traversal helpers (`mapSchemaProperties`, `mapSchemaMembers`,
`mapSchemaItems`) from `@internals/shared` in the zod, zod-mini, faker, and TypeScript printers,
replacing the per-printer property, member, and item walks. Generated output is unchanged.
