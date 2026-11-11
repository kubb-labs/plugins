---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-client': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Fix a plugin's `macros` that change an operation's `method` or `path` giving other plugins' names a numeric suffix. For example, a macro on `plugin-msw` that turns a `QUERY` operation into `POST` made the handler import `PaginationV1QueryResponse2` and `createPaginationV1QueryResponse2`, while `plugin-ts` and `plugin-faker` emit `PaginationV1QueryResponse` and `createPaginationV1QueryResponse`.

Operation names are now allocated per source operation (its input `pointer`), which a macro keeps, instead of per method and path. Specs without such a macro generate the same output as before.
