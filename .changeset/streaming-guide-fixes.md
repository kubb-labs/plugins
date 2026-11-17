---
'@kubb/plugin-axios': patch
'@kubb/plugin-fetch': patch
---

Fix the streaming guides: the resume example now retries a failed reconnect, rethrows the last failure, and no longer skips an event after a validation or render error. The manual `client.stream` example for JSON Lines sets `contentType.response`, and the typed event schema no longer contradicts itself.
