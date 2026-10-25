---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Skip hooks for `text/event-stream` operations to avoid invalid `.unwrap()` calls. Use the generated streaming clients to consume Server-Sent Events.
