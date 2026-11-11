---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Make generated response types match what the client returns at runtime.

- Type an XML, YAML or CSV response as `string`. An operation that returns JSON and XML has `data: Pet | string`, so narrow on `result.contentType`.
- Type an image, audio, video, PDF or `application/octet-stream` response as `Blob`, even when its schema says `type: string`.
- Type `result.contentType` as the bare media type, such as `'text/html'`, so a `switch` on it matches.
- Match the new types in Zod schemas, Faker mocks, Cypress requests and MSW handlers.
