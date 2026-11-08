---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Send `Accept: text/event-stream` on a stream call. Before, axios asked for JSON by default, so a server that picks the format from `Accept` answered with JSON and the call never ended. An `Accept` header you set still wins.
