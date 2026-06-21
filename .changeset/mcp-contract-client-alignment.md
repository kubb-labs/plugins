---
"@kubb/plugin-mcp": minor
---

Align `@kubb/plugin-mcp` with the other client consumers. Each tool handler now takes the grouped `{ path, query, headers, body }` config (matching the contract `<op>` and the cypress request shape) and forwards it to the resolved client function instead of re-building the request inline.

The `client` option is now a `'axios' | 'fetch'` selector, the same one the query plugins use. When `@kubb/plugin-axios` or `@kubb/plugin-fetch` is registered, the handlers import and call its generated `<op>`; otherwise they emit their own inline contract client. Set `baseURL` on the plugin for the inline case.

```ts
// before
pluginMcp({ client: { client: 'axios', baseURL: 'https://api.example.com' } })

// after — delegate to a registered client plugin
pluginAxios({ baseURL: 'https://api.example.com' })
pluginMcp({})

// after — no client plugin, inline runtime
pluginMcp({ client: 'axios', baseURL: 'https://api.example.com' })
```

The generated MCP tool `inputSchema` now nests its params under `path` / `query` / `headers` / `body` to match the handler shape. The `client.clientType` and `client.importPath` options are gone.
