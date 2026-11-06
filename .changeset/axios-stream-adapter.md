---
'@kubb/plugin-axios': patch
---

Keep the axios adapter of a stream call. Only a browser call with the default adapters switches to the fetch adapter, because XHR buffers the whole body. An adapter set on the instance, such as a mock adapter in tests, and the Node http adapter with its proxy and agent settings now apply to `text/event-stream` calls too.
