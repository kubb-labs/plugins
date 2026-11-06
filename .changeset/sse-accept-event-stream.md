---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Send `Accept: text/event-stream` on a stream call. axios asked for JSON by default, so a server that negotiates the format answered with JSON and the call never ended. Your own `Accept` header still wins.
