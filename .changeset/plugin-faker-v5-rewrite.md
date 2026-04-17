---
"@kubb/plugin-faker": major
---

Rewrite `@kubb/plugin-faker` for the v5 AST-based plugin architecture.

**Breaking changes:**
- Remove `contentType`, `dateType`, `unknownType`, and `emptySchemaType` options
- Replace `transformers: { name }` with `resolver`
- Replace `transformers` with a single `transformer` visitor
- Remove the `@kubb/plugin-oas` / `@kubb/oas` dependency; use `adapterOas()` in config instead

**New options and exports:**
- Add `compatibilityPreset`, `resolver`, `transformer`, `printer`, and `paramsCasing`
- Export `resolverFaker`, `resolverFakerLegacy`, and `printerFaker`
