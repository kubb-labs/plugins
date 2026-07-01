---
"@kubb/plugin-zod": minor
---

Emit `z.discriminatedUnion` for `oneOf`/`anyOf` schemas that carry a `discriminator` (kubb-labs/plugins#335).

Discriminated variants are commonly defined through `allOf` inheritance, which the printer rendered as a `ZodIntersection` (`base.and(…)`). `z.discriminatedUnion` rejects intersection options, so the output fell back to a plain `z.union` that tries every branch on parse.

An object-composable `allOf` is now rendered with `.extend({ … })` (zod) / `z.extend(base, { … })` (zod/mini) instead of `.and(…)`, keeping each variant a Zod object. When every variant resolves to a discriminable object, the union emits `z.discriminatedUnion('<propertyName>', [ … ])`, which dispatches on the discriminator, reports single-branch errors, and parses in constant time over the variant count. Variants that cannot flatten to an object — non-object members or a cyclic `z.lazy(…)` ref — keep the `z.union` fallback.
