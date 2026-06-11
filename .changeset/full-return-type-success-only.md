---
"@kubb/plugin-client": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-swr": minor
---

With `dataReturnType: 'full'`, generated return types and request generics now only cover success (2xx) responses. Both bundled clients throw for other statuses, so the previous union members for 4xx/5xx described states a resolved call could never reach:

```ts
// Before
return { ...res, data: createPetResponseSchema.parse(res.data) } as
  | { status: 201; data: CreatePetStatus201; statusText: string }
  | { status: 405; data: CreatePetStatus405; statusText: string }

// After
return { ...res, data: createPetResponseSchema.parse(res.data) } as { status: 201; data: CreatePetStatus201; statusText: string }
```

When the spec declares no 2xx response, every response stays included as a fallback. Error shapes remain available through `ResponseErrorConfig` on the thrown error.
