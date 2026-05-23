---
"@kubb/plugin-faker": patch
---

Fix `TS2339` in generated mocks when a schema is a `oneOf`/union of object shapes (kubb-labs/plugins#199).

Union members no longer index their properties against the union's own type. A key present on only some branches (e.g. a structured filter with `+order`/`+and`) made `NonNullable<Union>[K]` invalid; nested values now fall back to an `any` generic instead. Single-object schemas are unaffected and keep their precise `NonNullable<T>[K]` types.
