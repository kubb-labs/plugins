---
'@kubb/plugin-client': minor
---

Add `dataReturnType: 'fullByStatus'` — a new return shape that produces a discriminated union keyed by HTTP status code.

Each union member is `{ status: N; data: StatusNType; statusText: string; headers: Headers }`, so narrowing on `res.status` also narrows `res.data` to the matching response type from the spec. The `TData` generic on the underlying request call widens to cover all documented statuses, and the response is cast to the union at the return site.

```ts
pluginClient({ dataReturnType: 'fullByStatus' })
```

```ts
const res = await addPet(data)
if (res.status === 405) {
  res.data // narrowed to AddPetStatus405
}
```
