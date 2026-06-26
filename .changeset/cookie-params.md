---
"@kubb/plugin-ts": minor
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-vue-query": minor
---

Support OpenAPI cookie parameters.

The generated `*RequestConfig` type now carries a `cookie` group alongside `path`, `query`, `body`, and `headers`, typed from the operation's cookie parameters (or `never` when it has none). Pass `cookie` in the grouped options and the fetch and axios runtimes serialize it into the `Cookie` header, appending after any cookie an `apiKey` security scheme already wrote.
