---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Use a path-level or operation-level `servers` entry as that operation's default `baseURL`, so a call to an upload or streaming host no longer goes to the client's main host.

- The operation's `servers` win over the path's. The entry is picked with the adapter's `server.index`, falling back to the first one, and its `{variable}` placeholders are filled from `server.variables`, then from the spec defaults.
- A `baseURL` passed on the call still wins. The `baseURL` option, `setConfig`, and `createClient` do not override it.

```ts
request({ method: 'GET', url: '/.sse', baseURL: 'https://echo.websocket.org', ...config })
```
