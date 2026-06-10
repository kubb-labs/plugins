---
"@kubb/plugin-ts": minor
"@kubb/plugin-faker": patch
---

Group the `plugin-ts` enum options under a single `enum` object and add a `constCasing` control (kubb-labs/plugins#334).

The four loose top-level options collapse into one grouped object with clearer names:

```typescript
// before
pluginTs({ enumType: 'asConst', enumTypeSuffix: 'Key', enumKeyCasing: 'none' })

// after
pluginTs({ enum: { type: 'asConst', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' } })
```

The new `enum.constCasing` (`'camelCase'` default, or `'pascalCase'`) controls the casing of the generated const variable, which makes the old `enumType: 'asPascalConst'` redundant. `asPascalConst` is removed; use `enum: { type: 'asConst', constCasing: 'pascalCase' }` instead.

Pairing `constCasing: 'pascalCase'` with `typeSuffix: ''` now emits a const and a type that share the schema's exact name (`export const VehicleType` + `export type VehicleType`), and the barrel exports that name once instead of producing a duplicate `export type`. This matches the convention most hand-written codebases use, so migrating an existing project keeps every annotation and value reference intact.

`plugin-faker` reads the new `enum.type` / `enum.typeSuffix` shape from `plugin-ts`.
