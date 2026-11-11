---
'@kubb/plugin-zod': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-ts': patch
---

Fix OpenAPI 3.1 and 3.2 edge cases found on real specs.

- zod: a tuple keeps its rest items, so `prefixItems` with `items` prints `z.tuple([a], b)`. A `null` example stays in `.meta({ examples })`.
- cypress: a `style: cookie` array or object no longer throws.
- msw: a declared `Content-Type` response header is left out, so the mock no longer has a duplicate key.
- client: a string part of `multipart/mixed` declared as JSON is sent as JSON.
- An exact success code such as `200` now wins over a `2XX` range listed before it.
- ts: `@see` text from `externalDocs` and a serialized example can no longer start a JSDoc tag.
