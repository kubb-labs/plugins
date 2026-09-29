---
'@kubb/plugin-mcp': patch
---

Follow the client plugin's `returnType` in generated MCP handlers. With `pluginAxios({ returnType: 'data' })` or `pluginFetch({ returnType: 'data' })` the client call already resolves to the response body, but the handler still read `res.data` off it, so tools reported the body's own `data` property, usually `undefined`. Handlers now use the call result as the body under `'data'` and keep reading `res.data` under `'full'`.

Handlers also pass `throwOnError: true`, as the query plugins do, so a client configured with `throwOnErrorDefault: false` can't change the result shape the handler reads.
