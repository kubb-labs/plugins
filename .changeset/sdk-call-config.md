---
'@kubb/plugin-axios': patch
'@kubb/plugin-fetch': patch
---

SDK methods now build their call config the same way as the standalone functions. They now pass parameter `styles`, the `responseType`, and the `validator.error` hook, and a `text/event-stream` operation now returns a typed event stream.
