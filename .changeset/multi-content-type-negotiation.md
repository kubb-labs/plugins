---
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-axios": minor
"@kubb/plugin-fetch": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-msw": minor
"@kubb/plugin-ts": minor
"@kubb/plugin-zod": minor
---

Negotiate and discriminate multiple response content types.

A generated call now takes a `contentType: { request, response }` object. The `request` key picks the body format and the `response` key sets the `Accept` header. Both default to what the spec declares and stay overridable, and a bare `contentType: 'application/json'` string still selects the request type, so existing calls keep working.

When a status documents more than one content type, the result reports the type the server actually returned on `result.parsed`, so a caller can narrow `data` by it.

```ts
const result = await getPetById({ path: { petId: '1' }, contentType: { response: 'application/xml' } })

if (result.status === 200) {
  const { data, contentType } = result.parsed
  switch (contentType) {
    case 'application/json':
      console.log('JSON pet:', data.name)
      break
    case 'application/xml':
      console.log('XML pet:', data.id)
      break
  }
}
```

- `plugin-ts` emits a status with several content types as a discriminated union `{ contentType; data }` instead of a tagless union, so `result.parsed.contentType` narrows `result.parsed.data`. It keeps the individual per-content-type variant types (`GetPetByIdStatus200Json`, `GetPetByIdStatus200Xml`).
- `plugin-fetch` and `plugin-axios` add `deserializers` and `bodySerializers` maps to `RequestConfig` and `ClientConfig`, keyed by content type and matched with the charset stripped, for formats the runtime does not decode itself such as `application/xml`. The negotiated content type rides on `result.parsed` and on `ResponseError`.
- `plugin-react-query`, `plugin-vue-query`, and `plugin-swr` thread the `contentType` option through as the `{ request?, response? }` object.
- `plugin-zod` and `plugin-faker` emit one schema or mock per response content type plus a union alias, with variant names that line up across the plugins through the shared naming helpers.
- `plugin-msw` prefers the `application/json` content type for the mocked response when a status declares several.

Single-content-type operations generate the same output as before. The one breaking change is the shape of a multi-content-type status type. The plain body still lives on `result.data` for callers that do not need to discriminate.
