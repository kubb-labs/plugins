---
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Send query parameters described with `content: application/json` (or a `+json` media type) as one JSON-encoded, URL-encoded value, for example `?filter=%7B%22status%22%3A%22open%22%7D`, instead of the `deepObject` style. The generated request passes the media type as `contentType` in `styles.query`. Requires `@kubb/adapter-oas` with `ParameterNode.contentType` support.
