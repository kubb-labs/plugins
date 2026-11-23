---
'@kubb/plugin-client': patch
---

Pick an operation's or a path's own server with `meta.serverIndex` instead of reading `server.index` from the `@kubb/adapter-oas` options. The generated `baseURL` is the same. An adapter other than `adapterOas` can now choose the server too, by setting `serverIndex`.
