---
"@kubb/plugin-faker": patch
---

Fix `TS2322` errors in mocks generated for discriminated `oneOf` schemas (reported in kubb-labs/plugins#200).

Each union variant was annotated with the whole-union indexed-access type (`NonNullable<Union>["prop"]`), which TypeScript collapses to a single union member and rejects the other variants' values. The faker printer now narrows each variant to its own discriminated branch via `Extract<NonNullable<Union>, { "<discriminator>": "<value>" }>`. Undiscriminated unions of objects fall back to `any` instead of leaking the whole-union index (also resolving the related `TS2339` symptom).
