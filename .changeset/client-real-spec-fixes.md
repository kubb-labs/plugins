---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Fix generated clients and hooks that did not compile for four kinds of operation found in real OpenAPI 3.1 and 3.2 documents.

- An operation without a response body no longer imports a `<operation>ResponseSchema` that `@kubb/plugin-zod` never writes.
- A custom method from an OpenAPI 3.2 `additionalOperations` entry, such as `COPY`, is accepted as `method`.
- A JSON Lines response next to another content type is typed as the `ReadableStream` the client returns, and its stream handler is always registered. Read it with `parseJsonLines(result.data)`.
- A hook for a response with a stream variant types its data as the body or the stream, as the client does.
