---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Use a path's or operation's own `servers` entry as that operation's default `baseURL`, so a call to an upload or streaming host reaches it.

- The operation's `servers` win over the path's. The adapter's `server.index` picks the entry, falling back to the first, and `{variable}` placeholders take `server.variables`, then the spec defaults.
- Only a per-call `baseURL` overrides it. The `baseURL` option, `setConfig`, and `createClient` do not. A relative URL such as `/v2` is ignored.
