---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Use the `servers` entry on a path or operation as that operation's default `baseURL`, so its calls go to that host instead of the client's.

A call picks its base URL in this order:

1. `baseURL` passed on the call.
2. The operation's own `servers`.
3. The path's `servers`.
4. `createClient`, `setConfig`, or the `baseURL` option.

The adapter's `server.index` picks the entry, falling back to the first, and `{variable}` placeholders take `server.variables`, then the spec defaults. A relative URL such as `/v2` is skipped.
