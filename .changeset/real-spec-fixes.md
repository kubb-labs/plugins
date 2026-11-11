---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
---

Fix bugs found on real OpenAPI 3.0, 3.1 and 3.2 specs.

- A `'` in a path, media type, method or MCP server name no longer breaks the generated code, and `@see` text from `externalDocs` or a serialized example can no longer start a JSDoc tag.
- An exact success code such as `200` wins over a `2XX` range listed before it.
- ts, zod: an OpenAPI 3.0 `nullable: true` on an array item or a `oneOf`/`anyOf` member is kept.
- ts: a bare media type such as `'multipart/form-data'` is accepted as `contentType` on an operation with several request content types.
- client, hooks: an operation without a response body no longer imports a `<operation>ResponseSchema` that `@kubb/plugin-zod` never writes, and a custom OpenAPI 3.2 `additionalOperations` method, such as `COPY`, is accepted as `method`.
- client: a JSON Lines or `text/event-stream` response next to another content type is typed as the `ReadableStream` the client returns. Read JSON Lines with `parseJsonLines(result.data)`.
- client, msw: string Server-Sent Event `data` stays text per event, so `42` is not read as a number, and the mock sends it without JSON quotes.
- client: a `multipart/mixed` response is read as an array of parts, and a request body with an `itemSchema` is typed, validated and mocked as one. A string part declared as JSON is sent as JSON.
- client: security requirements that differ only in scopes are both kept, and a form-encoded `in: querystring` parameter follows the `style` and `explode` of its `encoding`.
