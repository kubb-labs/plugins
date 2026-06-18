---
"@kubb/plugin-faker": patch
---

Drop shapeless `allOf` members from generated mocks instead of spreading `...undefined`. An `allOf` that combines a `$ref` with a metadata-only schema (just `description`/`example`) produced invalid `{...createEquipmentCategory(), ...undefined}`. The metadata-only member now drops out, leaving `createEquipmentCategory()`.
