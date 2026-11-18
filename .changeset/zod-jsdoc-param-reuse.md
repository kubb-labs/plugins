---
'@kubb/plugin-zod': minor
---

Write each schema's `description` as a JSDoc comment above its const, so an editor shows it on hover, and mark a deprecated schema with `@deprecated`.

The grouped `path`, `query`, `headers`, and `cookies` schemas of an operation now reference the single-parameter schemas instead of repeating them, which makes the generated files smaller:

```ts
export const getPetByIdPathPetIdSchema = z.int()

export const getPetByIdPathSchema = z.object({
  petId: getPetByIdPathPetIdSchema,
})
```
