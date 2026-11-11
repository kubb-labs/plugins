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

- A text response, such as `application/xml`, `application/yaml`, or `text/csv`, is typed `string`. An operation that returns JSON and XML has `data: Pet | string`, so narrow on `result.contentType` to get the `Pet`. With a `codecs[...].deserialize`, cast `data` to what the codec returns.
- A response under `image/*`, `audio/*`, `video/*`, `application/pdf`, or `application/octet-stream` is typed `Blob`, even when its schema says `type: string`. A binary schema next to a JSON variant is typed `string`.
- `result.contentType` is typed as the bare media type the client reports, such as `'text/html'`, so `switch (result.contentType)` matches a key with parameters.
- A vendor JSON type such as `application/vnd.github.object` keeps its schema type, and a response without a body keeps `unknown`.
- Zod schemas and Faker mocks match the new types. Cypress casts its result to the declared type, and MSW sends a string body as raw text with its content type.
