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

- A `'` in a path, media type, method or MCP server name no longer breaks the generated code.
- ts, zod: an OpenAPI 3.0 `nullable: true` on an array item or a `oneOf`/`anyOf` member is kept.
- zod: a discriminated `oneOf` with a plain-string member, such as a `defaultMapping`, prints `z.union`. An `int64` keeps its bounds.
- client: string Server-Sent Event `data` stays text per event. A `multipart/mixed` response is read as an array of parts. Security requirements that differ only in scopes are both kept.
- faker: mocks keep to `multipleOf`, get `ipv4`, `ipv6`, `jwt`, `ulid`, `iban`, `duration` and `hostname` values, and keep `allOf` and `oneOf` members that are part of a cycle.
- msw: string event `data` is sent without JSON quotes.
- mcp: no tool for a response that offers a stream next to another type.
- `@see` text from an operation's `externalDocs` can no longer start a JSDoc tag.
