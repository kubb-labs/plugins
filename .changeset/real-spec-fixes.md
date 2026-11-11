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

- Escape a `'` in a path, media type, method or MCP server name, and JSDoc tags inside `@see` text.
- Prefer an exact success code such as `200` over a `2XX` range listed before it.
- Keep an OpenAPI 3.0 `nullable: true` on an array item or a `oneOf`/`anyOf` member in the types and Zod schemas.
- Accept a custom OpenAPI 3.2 method such as `COPY`, and stop importing a `<operation>ResponseSchema` that does not exist.
- Type a stream variant next to another content type as `ReadableStream`, keep string event `data` as text, and read a `multipart/mixed` response as an array of parts.
