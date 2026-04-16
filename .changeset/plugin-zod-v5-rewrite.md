---
"@kubb/plugin-zod": minor
---

Rewrite to v5 AST-based architecture. The plugin no longer depends on `@kubb/plugin-oas` or `@kubb/oas`.

**Breaking changes:**
- Remove `mapper`, `version`, `contentType` options
- Remove `transformers.name` and `transformers.schema` callbacks
- Move `integerType`, `emptySchemaType`, `unknownType` to `adapterOas(...)`
- `wrapOutput` callback now receives `SchemaNode` instead of `SchemaObject`
- `coercion` accepts granular object `{ dates?, strings?, numbers? }` in addition to `boolean`

**New options:**
- `paramsCasing?: 'camelcase'`
- `compatibilityPreset?: 'default' | 'kubbV4'`
- `resolver`, `transformer`, `printer`

**New exports:** `resolverZod`, `resolverZodLegacy`, `printerZod`, `printerZodMini`
