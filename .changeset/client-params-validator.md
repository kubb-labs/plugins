---
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-client': minor
---

Add `validator.params: 'zod'` to validate and encode path, query, and header params before a request is sent.

- Sends codec params in their wire form, such as a `Date` as `2026-10-01`, and rejects an invalid param before the request.
- Merges client and call `headers` case-insensitively, with the call winning.
- Adds a required `source` field to `ValidationErrorContext`.
- Narrows `client.getUrl` to a `UrlConfig` instead of a full `RequestConfig`.
- Requires a custom `@kubb/plugin-client` module to export `toHeadersStandardSchema` when `params` is on.

```typescript
pluginZod({ inferred: 'direction' })
pluginFetch({ validator: { request: 'zod', params: 'zod', response: 'zod' } })
```
