---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix two request encodings found by calling real APIs with the fetch, axios, and ky clients:

- A query parameter with `allowReserved` now still percent-encodes `#`, `&`, and `+`. Before, a `#` in the value cut off the rest of the query, so the parameters after it never reached the server.
- An `application/x-www-form-urlencoded` property whose `encoding` sets a JSON `contentType` is now sent as one JSON value, such as `meta=%7B%22a%22%3A1%7D`. Before, the JSON `contentType` was ignored and the object was spread into separate fields. A property that also sets `style`, `explode`, or `allowReserved` keeps that style, as OpenAPI says.
