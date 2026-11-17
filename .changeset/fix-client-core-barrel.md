---
'@kubb/plugin-client': patch
---

Keep the shared client core out of generated barrels so fetch and axios clients expose `ResponseError`, `isResponseError`, and transport-specific types through the public entry point without conflicting exports.
