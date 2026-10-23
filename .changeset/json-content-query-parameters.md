---
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Send parameters described with `content: application/json` (or a `+json` media type) as one JSON-encoded value. A query parameter becomes `?filter=%7B%22status%22%3A%22open%22%7D` instead of the `deepObject` style, a cookie is JSON-encoded and URL-encoded, and a header carries the JSON string. The generated request passes the media type as `contentType` in `styles.query`, `styles.header`, and `styles.cookie`. Requires `@kubb/adapter-oas` with `ParameterNode.contentType` support.
