---
'@kubb/plugin-ky': minor
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-swr': minor
'@kubb/plugin-mcp': minor
---

Add `@kubb/plugin-ky`, which generates a type-safe HTTP client that sends with [Ky](https://github.com/sindresorhus/ky). Pass Ky options such as `retry`, `timeout`, and `hooks` in `options`, on a call or with `client.setConfig`. The query and MCP plugins accept `client: 'ky'`.

```ts
import { pluginKy } from '@kubb/plugin-ky'

export default defineConfig({
  plugins: [pluginTs(), pluginKy({ baseURL: 'https://petstore.swagger.io/v2' })],
})
```
