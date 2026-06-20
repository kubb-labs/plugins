---
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-swr": minor
---

Query hooks can now call the slim client plugins directly. Register `@kubb/plugin-fetch` or `@kubb/plugin-axios` and set `client: 'fetch' | 'axios'` — or register a single slim plugin and it is auto-detected — and the generated hooks import its operation functions, return the response body, and surface `ResponseError` from the bundled `.kubb/client.ts`.

The `client` object is deprecated but still honored, so existing configurations regenerate byte-identical.
