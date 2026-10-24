---
'@kubb/plugin-zod': minor
---

Add `inferred: 'direction'`, which types request schemas with `z.input` and response schemas with `z.output`, so both use the domain value of a codec.

- Keeps `z.infer` for every alias with `inferred: true`.
- Emits the grouped `<operation>PathSchema`, `QuerySchema`, and `HeadersSchema` for every operation with params, not only with `inferred`.
