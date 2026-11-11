---
'@kubb/plugin-client': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-zod': patch
---

Use the shared `ast`, `casing` and `code` helpers from `@kubb/kit`. Generated code stays the same, except:

- `@kubb/plugin-msw` mocks a `text/json` response as JSON.
- `@kubb/plugin-zod` prints bigint bounds as inclusive, such as `.min(1n)` for `exclusiveMinimum: 0`.
- A `group: { type: 'path' }` folder is the camelCased first path segment, such as `petStore` for `/pet-store/{id}`.
