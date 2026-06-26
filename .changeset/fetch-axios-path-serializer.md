---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Fix the `[object Object]` path-parameter bug and bring the generated fetch and axios client in line with the OpenAPI serialization spec for path, query, header, and cookie parameters, plus urlencoded request bodies.

**Path parameter fix.** The runtime client interpolated each `{placeholder}` with `String(value)`, so an array or object path param produced a broken URL (`/pet/[object Object]`). The generated client now has a `defaultPathSerializer` that defaults to the OpenAPI `simple` style with `explode: false`: arrays join their URL-encoded members with commas (`/pet/3,4,5`) and objects flatten to comma-separated `key,value` pairs. Primitives stay URL-encoded as before.

**Style / explode support.** `defaultPathSerializer` honors per-parameter OpenAPI serialization metadata:

- `simple` (default) → `3,4,5`
- `label` → `.3,4,5` (or `.3.4.5` with `explode`)
- `matrix` → `;id=3,4,5` (or `;id=3;id=4;id=5` with `explode`)

A request carries this metadata in a new `pathStyles` field, `Record<string, { style?, explode? }>`, which the runtime passes to the serializer per placeholder. The `PathSerializer` signature is now `(name, value, options?) => string`. (The generator wiring that fills `pathStyles` from the spec follows once the OpenAPI adapter captures `style` / `explode`.)

**Query style / explode / allowReserved support.** `defaultQuerySerializer` now honors per-parameter OpenAPI query metadata: `form` (default), `spaceDelimited`, `pipeDelimited`, and `deepObject`, each with `explode`, plus `allowReserved` to keep RFC 3986 reserved characters unencoded. The metadata rides a new `queryStyles` field, `Record<string, { style?, explode?, allowReserved? }>`, and the `QuerySerializer` signature is now `(params, options?) => string`. Members without metadata keep the previous defaults (arrays explode into repeated keys, nested objects use `deepObject`), so existing output is unchanged.

**Header parameters.** Array and object header params serialize with the OpenAPI `simple` style (`explode` honored, not URL-encoded) via a new `headerStyles` field. Headers without metadata pass through unchanged.

**Cookie parameters.** Cookie params serialize into the `Cookie` header using the OpenAPI `form` style (URL-encoded, `; `-joined, `explode` honored). A request carries them in a new `cookies` field with optional `cookieStyles` metadata, and `cookies` is part of the grouped `DataShape`.

**Request-body `encoding`.** `defaultBodySerializer` accepts per-property `encoding` for `application/x-www-form-urlencoded` bodies, honoring each property's `style` / `explode` / `allowReserved` (reusing the query rules). The metadata rides a new `bodyEncoding` field.

**Object serializer signatures.** `PathSerializer` and `BodySerializer` now take a single object argument (`{ name, value, options? }` and `{ body, contentType?, encoding? }`) following the repo convention for functions with more than two parameters.

**Shared style type.** The per-location style types derive from one generic base, `SerializationStyle<TStyle> = { style?: TStyle; explode?; allowReserved? }`. `QueryParamStyle`, `PathParamStyle`, and `BodyEncoding` alias it, so a future spec adapter (AsyncAPI, GraphQL) can reuse the same vocabulary.

**Grouped serializer option (breaking).** The separate `querySerializer` / `bodySerializer` options on `ClientConfig` and `RequestConfig` are replaced by a single `serializer` object:

```ts
serializer?: {
  query?: QuerySerializer
  body?: BodySerializer
  path?: PathSerializer
}
```

Each field is resolved independently (per-call over client over default). Migrate `querySerializer: fn` to `serializer: { query: fn }` and `bodySerializer: fn` to `serializer: { body: fn }`.
