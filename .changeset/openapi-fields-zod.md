---
'@kubb/plugin-zod': minor
---

Support more of OpenAPI 3.1 and 3.2:

- A response that declares `headers` gets a schema for them, such as `listPetsStatus200HeadersSchema`. It describes the headers as the spec declares them, while a fetch `Headers` object has lowercase names and string values.
- A `2XX` status range counts as a success response, so it moves from `<name>ErrorSchema` to `<name>ResponseSchema`.
- zod/mini prints `exclusiveMinimum` and `exclusiveMaximum` as `z.gt` and `z.lt`, which compile.

The printers read the new `min`, `max` and `exclusive` fields instead of the deprecated `minProperties`, `maxProperties`, `exclusiveMinimum` and `exclusiveMaximum`. A custom node that only sets the deprecated fields loses those checks.
