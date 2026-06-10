---
'@kubb/plugin-client': minor
---

`dataReturnType: 'full'` now returns a status-discriminated union instead of a flat `ResponseConfig<TData>`.

Each union member is `{ status: N; data: StatusNType; statusText: string }`. Narrowing on `res.status` also narrows `res.data` to the matching response type. The function's response generic covers every documented status code.

```ts
pluginClient({ dataReturnType: 'full' })
```

```ts
const res = await addPet(data)
if (res.status === 405) {
  res.data // narrowed to AddPetStatus405
}
```
