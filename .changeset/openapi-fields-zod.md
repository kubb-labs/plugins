---
'@kubb/plugin-zod': minor
---

Add a schema for response headers, and fix exclusive bounds in zod/mini.

- Add a schema for a response's `headers`, such as `listPetsStatus200HeadersSchema`. It holds the spec's types, so it does not parse a fetch `Headers` object.
- Move a `2XX` range from `<name>ErrorSchema` to `<name>ResponseSchema`.
- Print `exclusiveMinimum` and `exclusiveMaximum` as `z.gt` and `z.lt` in zod/mini. The old output did not compile.
- Set `min`, `max` and `exclusive` on a custom node. The deprecated `minProperties`, `maxProperties`, `exclusiveMinimum` and `exclusiveMaximum` are no longer read.
