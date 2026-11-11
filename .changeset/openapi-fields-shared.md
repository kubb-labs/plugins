---
'@kubb/plugin-ts': minor
'@kubb/plugin-zod': minor
'@kubb/plugin-faker': minor
'@kubb/plugin-msw': minor
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-cypress': patch
---

Read the OpenAPI 3.1 and 3.2 fields that Kubb 5.18 adds, which needs Kubb 5.18.4 or later.

- Treat a status range such as `2XX` as a success response.
- Write a range in lower case: `ListPetsStatus2XX` becomes `ListPetsStatus2xx`, and the `'2XX'` key becomes `'2xx'`.
- Add `@see` from an operation's `externalDocs` to its JSDoc.

After you regenerate, rename imports of the `…Status2XX` names. An upper-case range key such as `'2XX'` or `'5XX'` in a hand-written responses record or `validator.error` map is no longer read, so write it in lower case.
