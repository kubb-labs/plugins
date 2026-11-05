---
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix `parseEventStream` splitting one Server-Sent Event in two when a `\r\n` line ending falls across two reads.
