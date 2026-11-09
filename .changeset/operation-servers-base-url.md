---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Use the `servers` entry on a path or operation as that operation's default `baseURL`, so its calls go to that host instead of the client's.

- The operation's `servers` win over the path's. The adapter's `server.index` picks the entry, falling back to the first, and `{variable}` placeholders take `server.variables`, then the spec defaults.
- Only a per-call `baseURL` overrides it. The `baseURL` option, `setConfig`, and `createClient` do not. A relative URL such as `/v2` is ignored.
