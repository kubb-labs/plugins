---
"@kubb/plugin-zod": minor
---

Emit `z.discriminatedUnion` for `oneOf`/`anyOf` schemas with a `discriminator` (kubb-labs/plugins#335).

Variants defined through `allOf` used to render as intersections (`base.and(…)`), which `z.discriminatedUnion` rejects, so the output fell back to a plain `z.union`. Object `allOf` variants now render with `.extend({ … })` (zod) or `z.extend(base, { … })` (zod/mini), so each stays a Zod object and the union discriminates on the property. Variants that can't flatten to an object, like a cyclic `z.lazy(…)` ref, keep the `z.union` fallback.
