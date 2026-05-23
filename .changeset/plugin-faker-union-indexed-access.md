---
"@kubb/plugin-faker": patch
---

Fix `TS2339` in generated mocks when a schema is a `oneOf`/union of object shapes (kubb-labs/plugins#199).

The object printer indexed property types as `NonNullable<T>[K]`, which fails on union types where only some branches carry the key (e.g. a structured filter with `+order`/`+and`). Property types are now indexed via `(NonNullable<T> & Record<K, unknown>)[K]`, which stays valid for unions while preserving the precise type for single-object schemas.
