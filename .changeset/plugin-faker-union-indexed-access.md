---
"@kubb/plugin-faker": patch
---

Fix `TS2339` in generated mocks when a schema is a `oneOf`/union of object shapes (kubb-labs/plugins#199).

Inside a union, object properties were indexed against the union type as `NonNullable<Union>[K]`, which fails for a key carried by only some branches (e.g. a structured filter with `+order`/`+and`). Union members now index via `(NonNullable<Union> & Record<K, unknown>)[K]`: branches that have the key keep their precise type (so discriminated unions stay exact), branches that don't contribute `unknown`. Single-object schemas are unaffected and keep their plain `NonNullable<T>[K]` types.
