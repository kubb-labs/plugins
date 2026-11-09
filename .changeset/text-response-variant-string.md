---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Type a response body the client returns as text, such as `application/xml`, `application/yaml`, or `text/csv`, as `string` instead of its schema.

The client parses JSON, returns a `Blob` for a binary type and a stream for `text/event-stream`, and returns any other body as text. The types, Zod schemas, and Faker mocks now match that. For an operation that returns JSON and XML, such as `getPetById`, `data` is `Pet | string`, so narrow on `result.contentType` to get the `Pet`. JSON, binary, stream, and wildcard (`*/*`) responses keep their schema, and so does a text response whose schema is already a string. With a `codecs[...].deserialize`, cast `data` to what the codec returns.

Cypress requests now cast their result to the declared return type, so a body type such as `Pet | string` compiles.
