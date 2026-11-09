---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Type a text response, such as `application/xml`, `application/yaml`, or `text/csv`, as `string`, since the client returns it as text.

- An operation that returns JSON and XML, such as `getPetById`, has `data: Pet | string`. Narrow on `result.contentType` to get the `Pet`.
- JSON, binary, stream, and `*/*` responses keep their schema, as does a text response whose schema is a string. With a `codecs[...].deserialize`, cast `data` to what the codec returns.
- Zod schemas and Faker mocks match the new types. Cypress casts its result to the declared type, and MSW sends a string body as raw text with its content type.
