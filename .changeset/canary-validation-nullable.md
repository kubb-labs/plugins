---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
---

An OpenAPI 3.0 `nullable: true` on an array item or on a `oneOf` or `anyOf` member is kept: `items: { type: string, nullable: true }` now prints `(string | null)[]` and `z.array(z.string().nullable())`. `plugin-zod` prints `z.union` when a member of a discriminated `oneOf` types the discriminator as a plain string, such as an OpenAPI 3.2 `defaultMapping` member, where `z.discriminatedUnion` threw on every parse.
