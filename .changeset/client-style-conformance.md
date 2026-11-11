---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix request serialization that did not match the OpenAPI style examples.

- `spaceDelimited` and `pipeDelimited` default `explode` to `false`, as OpenAPI does, so an array goes out as `ids=1%7C2` instead of `ids=1&ids=2`. This covers query parameters, form-urlencoded bodies and multipart parts.
- A `pipeDelimited` value percent-encodes its `|` as `%7C`, and a non-exploded delimited object joins its keys and values with the style's delimiter instead of `,`.
- `allowReserved` keeps a percent-encoded triple such as `%20` as it is, instead of encoding it again to `%2520`.
- An `in: querystring` string is sent as the whole query, percent-encoded unless its media type is form-urlencoded.
- An empty `matrix` path value is written `;color`, without `=`, as RFC 6570 does.
- A string in an `application/json` multipart part is sent as JSON, quoted.
- A `multipart/mixed` response splits only on a boundary at the start of a line, so the boundary text inside a part no longer splits it.
