---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Document that a custom client's `toEventStream` gets `{ shape: 'line' }` for a JSON Lines operation, and that an `application/json-seq` record must fit on one line.
