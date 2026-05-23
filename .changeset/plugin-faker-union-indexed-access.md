---
"@kubb/plugin-faker": patch
---

Keep mocks for non-discriminated `oneOf` unions type-safe (kubb-labs/plugins#199).

Building on the discriminated-union fix, members of a union without a discriminator now index each property via `(NonNullable<Union> & Record<K, unknown>)[K]` instead of falling back to `any`. A key carried by only some branches resolves to `unknown` rather than `any`, so the generated value stays type-checked. Single-object schemas keep their plain `NonNullable<T>[K]` types.
