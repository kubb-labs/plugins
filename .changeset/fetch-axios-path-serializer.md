---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Serialize array and object path parameters instead of emitting `[object Object]`, and group the client serializers under a single `serializer` option.

**Path parameter fix.** The runtime client interpolated each `{placeholder}` with `String(value)`, so an array or object path param produced a broken URL (`/pet/[object Object]`). The generated client now has a `defaultPathSerializer` that follows the OpenAPI `simple` style (`explode: false`): arrays join their URL-encoded members with commas (`/pet/3,4,5`) and objects render as comma-separated `key=value` pairs (`/point/x=1,y=2`); primitives stay URL-encoded as before. It is wired into both the send path and `getUrl`.

**Grouped serializer option (breaking).** The separate `querySerializer` / `bodySerializer` options on `ClientConfig` and `RequestConfig` are replaced by a single `serializer` object that also carries the new path serializer:

```ts
serializer?: {
  query?: QuerySerializer
  body?: BodySerializer
  path?: PathSerializer
}
```

Each field is resolved independently (per-call over client over default), so a call can override just `serializer.path` while the client's `serializer.query` still applies. Migrate `querySerializer: fn` to `serializer: { query: fn }` and `bodySerializer: fn` to `serializer: { body: fn }`.

Full OpenAPI `label` / `matrix` style support needs the per-parameter `style` / `explode` from the spec and will follow as a separate change.
