---
"@kubb/plugin-zod": minor
---

Suffix inferred Zod type aliases with `Type` so they never collide with the schema value (kubb-labs/plugins#332).

With `inferred: true`, the `z.infer<typeof schema>` alias is now the PascalCased schema name plus a `SchemaType` suffix (`petSchema` → `PetSchemaType`). Previously the value and the type were told apart only by casing (`petSchema` vs `PetSchema`), so an all-uppercase schema name such as `SUV`, `URL`, or `API` produced the same identifier for both and the barrel re-exported it twice, failing with `TS2300: Duplicate identifier`.

This renames generated inferred types: `PetSchema` becomes `PetSchemaType`. Update any imports that referenced the old name.
