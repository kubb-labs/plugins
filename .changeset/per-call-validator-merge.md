---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Merge a `validator` passed on one call with the generated one per key, so `validator: { request }` keeps the generated response and error validators.

- On the fetch and axios clients, a per-call `styles` entry overrides the generated style of that parameter only and keeps the others.
