---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Send `Accept: text/event-stream` on a stream call. axios sends `Accept: application/json, text/plain, */*` by default, so a server that negotiates the format, such as Wikimedia EventStreams, answered with JSON, and the call waited for a body that never ends. A caller's own `Accept` header still wins.
