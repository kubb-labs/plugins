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

- `result.contentType` is typed as the bare media type the client reports, such as `'text/html'`. Before, a key with parameters such as `text/html; charset=utf-8` became the type, so `switch (result.contentType)` never matched.
- A response under `image/*`, `audio/*`, `video/*`, `application/pdf`, or `application/octet-stream` is typed `Blob`, even when its schema says `type: string`. The client always reads these as a `Blob`, so an SVG typed `string` failed at runtime.
- A binary schema next to a JSON variant, such as `application/vnd.noaa.dwml+xml`, is typed `string`, since the client reads it as text. Before, `validator: 'zod'` rejected every such response.
- A response without a body, such as a `405` on an operation with a form body, keeps its `unknown` type instead of becoming `string`.
- A vendor media type such as `application/vnd.github.object` keeps its schema type, because the client parses its JSON body. XML, YAML, and CSV vendor types stay `string`.
