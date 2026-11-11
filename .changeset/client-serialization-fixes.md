---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix request serialization that did not match the OpenAPI style examples.

- Send an array of objects with `style: deepObject` as indexed keys, such as `items[0][price]=p_1`, instead of `items=[object Object]`.
- Default `explode` to `false` for `spaceDelimited` and `pipeDelimited`, so an array goes out as `ids=1%7C2`.
- Keep `#`, `&`, `+` and `%20` intact with `allowReserved`, and send a space as `%20` instead of `+`.
- Follow the `encoding` of a form body property: a JSON `contentType` sends one JSON value, and `explode: false` sends a multipart array as one part.
- Stop writing `//` before the path when `baseURL` ends in `/`.

The serialization guides now list how each `style` and `explode` combination is encoded.
