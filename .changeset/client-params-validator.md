---
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Add `validator.params: 'zod'` to encode path, query, and header params before a request is sent. Each group runs through its generated `<operation>PathSchema` / `QuerySchema` / `HeadersSchema` the same way `validator.request` runs the body, so a codec param such as a `Date` goes out in its wire form (`/events/2026-10-01`) and an invalid param fails before the call. The runtime stays on Standard Schema (`~standard.validate`). What a validator returns is exactly what is sent, so a value `onValidationError` replaces or a key the schema drops stays that way. Headers are validated as one set: client-level defaults together with the call's headers, one key per header. The generated call wraps the headers schema in `toCaseInsensitiveLooseObjectStandardSchema(schema, schema.shape)` from `.kubb/standardSchema.ts`: it matches declared headers in any casing, keeps the caller's casing, and passes undeclared headers such as `Authorization` or tracing headers through untouched. It only needs a Standard Schema plus the object's declared keys, so it also fits other libraries (`schema.entries` for valibot). Query and header values added by `auth` are applied after validation and never pass through the schema. `ValidationErrorContext` gains a required `source` field (`'body' | 'path' | 'query' | 'headers'`), so `onValidationError` can tell which part failed: `'body'` for request, response, and error bodies, or one of the param groups. `direction` is unchanged. `client.getUrl` still serializes params as passed.

With `pluginZod({ inferred: 'direction' })`, request types take the domain value (a `Date`) that these validators encode, so enable `validator: { request: 'zod', params: 'zod' }` alongside it.

```typescript
pluginZod({ inferred: 'direction' })
pluginFetch({ validator: { request: 'zod', params: 'zod', response: 'zod' } })

await putEvent({
  path: { day: new Date('2026-10-01') }, // PUT /events/2026-10-01
  query: { after: new Date() },
  body: { startsAt: new Date() },
})
```
