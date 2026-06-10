---
'@kubb/plugin-client': minor
---

`dataReturnType: 'full'` now returns a status-discriminated union instead of a flat `ResponseConfig<TData>`.

Each union member is `{ status: N; data: StatusNType; statusText: string; headers: Headers }`, so narrowing on `res.status` also narrows `res.data` to the matching per-spec response type. The `TData` generic on the underlying request widens to cover all documented statuses.

```ts
pluginClient({ dataReturnType: 'full' })
```

```ts
const res = await addPet(data)
if (res.status === 405) {
  res.data // narrowed to AddPetStatus405
}
```
