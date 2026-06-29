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

When a status documents more than one content type, the result reports the type the server returned on `result.contentType`, next to `status` and `data`, so a caller can narrow `data` by it.

```ts
const result = await getPetById({ path: { petId: '1' }, contentType: { response: 'application/xml' } })

if (result.status === 200) {
  const { data, contentType } = result
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

- `plugin-ts` discriminates a status that documents several content types by content type in the `<Name>Responses` record, so `result.contentType` narrows `result.data`. The standalone `<Name>StatusNNN` alias stays the plain body union, and the individual per-content-type variant types (`GetPetByIdStatus200Json`, `GetPetByIdStatus200Xml`) are kept.
- `plugin-fetch` and `plugin-axios` add `deserializers` and `bodySerializers` maps to `RequestConfig` and `ClientConfig`, keyed by content type and matched with the charset stripped, for formats the runtime does not decode itself such as `application/xml`. The negotiated content type rides on `result.contentType` and on `ResponseError`.
- `plugin-react-query`, `plugin-vue-query`, and `plugin-swr` thread the `contentType` option through as the `{ request?, response? }` object.
- `plugin-zod` and `plugin-faker` emit one schema or mock per response content type plus a union alias, with variant names that line up across the plugins through the shared naming helpers.
- `plugin-msw` prefers the `application/json` content type for the mocked response when a status declares several.

Single-content-type operations generate the same output as before. The breaking change is that the result now carries `contentType`, and the per-status responses record shape changes for a status with several content types.
