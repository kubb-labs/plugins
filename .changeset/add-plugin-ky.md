---
'@kubb/plugin-ky': minor
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-swr': minor
'@kubb/plugin-mcp': minor
'@kubb/plugin-fetch': patch
'@kubb/plugin-client': patch
---

Add `@kubb/plugin-ky`, which generates a type-safe HTTP client that sends with [Ky](https://github.com/sindresorhus/ky). Pass Ky options such as `retry`, `timeout`, and `hooks` in `options`, on a call or with `client.setConfig`. A call is sent once unless you set `retry`, as with the fetch and axios clients. The query and MCP plugins accept `client: 'ky'`.

```ts
import { pluginKy } from '@kubb/plugin-ky'

export default defineConfig({
  plugins: [pluginTs(), pluginKy({ baseURL: 'https://petstore.swagger.io/v2' })],
})
```

The `@kubb/plugin-fetch` and `@kubb/plugin-client` docs now point to `@kubb/plugin-ky`.
