---
"@kubb/plugin-client": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-swr": minor
---

New `throwOnError` option on `@kubb/plugin-client` (default `true`), also available on the `client` sub-object of the query plugins.

With the default, a resolved call always means success: generated response generics, the `dataReturnType: 'full'` status union, and zod response validation only cover success (2xx) responses, since error responses throw.

```ts
// throwOnError: true (default)
const res = await request<CreatePetStatus201, ResponseErrorConfig<CreatePetStatus405>, CreatePetData>({ ... })
return { ...res, data: createPetResponseSchema.parse(res.data) } as { status: 201; data: CreatePetStatus201; statusText: string }
```

With `throwOnError: false`, every documented status resolves: the generated call passes `throwOnError: false` to the runtime client, types widen to every status, and zod validation parses against an inline union of the per-status schemas. Pair it with `dataReturnType: 'full'` and narrow on `res.status`.

```ts
// throwOnError: false
const res = await request<CreatePetStatus201 | CreatePetStatus405, ResponseErrorConfig<CreatePetStatus405>, CreatePetData>({ ..., throwOnError: false })
return { ...res, data: z.union([createPetStatus201Schema, createPetStatus405Schema]).parse(res.data) } as
  | { status: 201; data: CreatePetStatus201; statusText: string }
  | { status: 405; data: CreatePetStatus405; statusText: string }
```

When the spec declares no 2xx response, the success-only forms fall back to every documented response.
