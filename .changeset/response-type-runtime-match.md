---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Make generated response types match what the client returns at runtime:

- `result.contentType` is typed as the bare media type, such as `'text/html'`, which is the value the client reports. Before, a spec key with parameters, such as `text/html; charset=utf-8; profile="…"`, became the type, so a `switch (result.contentType)` never matched.
- A response under `image/*`, `audio/*`, `video/*`, `application/pdf`, or `application/octet-stream` is typed `Blob`, even when its schema says `type: string`. The client always reads these as a `Blob`, so an SVG typed `string` failed at runtime.
- A binary schema on a media type such as `application/vnd.noaa.dwml+xml`, next to a JSON variant, is typed `string`. Without `parseAs: 'blob'` the client reads it as text, and `validator: 'zod'` rejected every such response.
- A response without a body, such as a Swagger 2.0 `405`, keeps its `unknown` type instead of becoming `string`.
