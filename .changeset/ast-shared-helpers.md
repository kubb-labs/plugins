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

Read media types, status codes, servers, auth, parameters, stream framing and number bounds through the `ast` helpers from `@kubb/kit`, and print literals with `code`, instead of each plugin's own copy. Generated code stays the same, except:

- `@kubb/plugin-msw` mocks a `text/json` response as JSON, like `application/json`.
- `@kubb/plugin-zod` prints a bigint's bounds inclusive, such as `.min(1n)` for `exclusiveMinimum: 0`, the same bounds `@kubb/plugin-faker` mocks against.
- A `group: { type: 'path' }` folder is the camelCased first path segment, such as `petStore` for `/pet-store/{id}`, the same as Kubb names it.
