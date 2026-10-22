---
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-client': minor
---

Add `validator.params: 'zod'` to validate and encode path, query, and header params before a request is sent.

- **Params validation:** each param group runs through its generated `<operation>PathSchema` / `QuerySchema` / `HeadersSchema`. A codec param such as a `Date` is sent in its wire form (`/events/2026-10-01`), and an invalid param fails before the request. Values added by `auth` are not validated.
- **Custom client module (`@kubb/plugin-client`):** with `params: 'zod'` on, generated calls import `toHeadersStandardSchema` from your `importPath` module, so that module must export it.
- **Header merging:** client-level `headers` and the call's headers are merged case-insensitively into one key per header, with the call winning.
- **Header styles on client headers:** a non-string client-level header that matches a header param with `style`/`explode` is now serialized in that style (`['a', 'b']` becomes `a,b`) instead of `JSON.stringify`, the same as call headers.
- **Type change:** `ValidationErrorContext` has a new required `source` field (`'body' | 'path' | 'query' | 'headers'`). Code that builds a `ValidationErrorContext` itself must set it.
- **Type change:** `client.getUrl` takes a `UrlConfig` (`baseURL`, `url`, `path`, `query`, `params`, `serializer`, `styles`) instead of a full `RequestConfig`. Passing other fields, such as `validator`, in an object literal is now a type error.

Use it with `pluginZod({ inferred: 'direction' })` so request types accept the domain values these validators encode:

```typescript
pluginZod({ inferred: 'direction' })
pluginFetch({ validator: { request: 'zod', params: 'zod', response: 'zod' } })

await putEvent({
  path: { day: new Date('2026-10-01') }, // PUT /events/2026-10-01
  query: { after: new Date() },
  body: { startsAt: new Date() },
})
```
