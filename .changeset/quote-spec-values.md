---
'@kubb/plugin-ts': patch
'@kubb/plugin-client': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Quote values from the OpenAPI document with `text.quote` from `@kubb/kit`. A path, content type, operation ID or property name that holds a `'` no longer breaks the generated code.

`@kubb/plugin-ts` now quotes an object-type key that is not an identifier with single quotes, the same as the other plugins: `{ 'content-type': string }` instead of `{ "content-type": string }`.
