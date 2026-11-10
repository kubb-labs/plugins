---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix four request encodings found by calling real APIs with the fetch, axios, and ky clients:

- An array of objects with `style: deepObject` is now sent with indexed keys, such as `items[0][price]=p_1`. Before, each object went out as `items=[object Object]`, so the data was lost. This affects form bodies such as Stripe's `items` and `line_items`. An array of primitives still repeats its key.
- A `multipart/form-data` array of scalars whose `encoding` sets `explode: false` is now sent as one part, with its items joined by the style's delimiter, such as `a,b`. Before, each item went out as its own part.
- A `baseURL` that ends in `/` no longer gives `//` before the path. On plugin-axios this worked before v6.
- A space in a query parameter without a style is now sent as `%20`, as RFC 6570 and OpenAPI say, the same as a parameter with a style. Before, it was sent as `+`. Servers decode both the same. A form body still uses `+`.
