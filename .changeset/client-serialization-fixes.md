---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix request serialization that did not match the OpenAPI style examples, found by calling real APIs with the fetch, axios, and ky clients.

- Query: `allowReserved` still percent-encodes `#`, `&`, and `+`, and keeps a percent-encoded triple such as `%20` as it is. A space without a style is sent as `%20`, not `+`. An `in: querystring` string is sent as the whole query.
- `deepObject`: an array of objects is sent with indexed keys, such as `items[0][price]=p_1`, instead of `items=[object Object]`.
- `spaceDelimited` and `pipeDelimited` default `explode` to `false`, so an array goes out as `ids=1%7C2`. The `|` is percent-encoded, and a non-exploded object joins its keys and values with the style's delimiter.
- Form bodies: a urlencoded property whose `encoding` sets a JSON `contentType` is sent as one JSON value, unless it also sets `style`, `explode`, or `allowReserved`. A multipart array of scalars with `explode: false` is sent as one part, and a string in an `application/json` part is sent quoted.
- `multipart/mixed`: a part sends the first type of an Encoding `contentType` list, and a response splits only on a boundary at the start of a line.
- Path and cookie: an empty `matrix` value is written `;color`, and an exploded `form` cookie object percent-encodes its keys.
- A `baseURL` that ends in `/` no longer gives `//` before the path.

The serialization guides of `@kubb/plugin-fetch` and `@kubb/plugin-axios`, and the write-your-client guide of `@kubb/plugin-client`, now list how each `style` and `explode` combination is encoded.
