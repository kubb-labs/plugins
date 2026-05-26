---
"@kubb/plugin-faker": patch
---

Make generated faker functions report precise return types for nullish API fields.

Object faker functions previously returned `Required<T>`, which removed `?` optionals
but kept explicit `| null` unions even though faker always produces a concrete value
(e.g. a field typed `string | null` in the DTO was still `string | null`).

Generated object fakers are now generic and derive their return type from the data
they actually build:

```ts
export function createPet<TData extends Partial<Pet> = object>(data?: TData) {
  const defaultFakeData = { id: faker.number.int(), maybeNickname: faker.string.alpha() /* ... */ }
  return { ...defaultFakeData, ...(data || {}) } as Omit<typeof defaultFakeData, keyof TData> & TData
}
```

- Non-overridden fields take faker's exact type — `createPet().maybeNickname` is `string`,
  not `string | null`, and `createPet().id` is `number`.
- Overrides narrow the result — `createPet({ status: 'sold' }).status` is `'sold'`.
- The result stays assignable to the DTO type, so existing usages keep working.

Resolves kubb-labs/plugins#247.
