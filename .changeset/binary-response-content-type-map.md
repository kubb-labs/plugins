---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Pick the response parser per content type when one success response declares several. A binary body such as `audio/mpeg` is a `Blob` next to a `text/event-stream` response, and a schema with `format: binary` is a `Blob` whatever its media type.

- A generated call sets `responseType` to a map such as `{ 'audio/mpeg': 'blob', 'text/event-stream': 'stream' }` when the parsers differ, and to one string when they match.
- The runtime picks the entry matching the response `Content-Type`, with a `type/*` wildcard, before it guesses from the media type.
- A custom client receives the map on `responseType`, so widen its type to `string | Record<string, string>`.
