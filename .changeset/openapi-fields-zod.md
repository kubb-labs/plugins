---
'@kubb/plugin-zod': minor
---

Validate the JSON Schema 2020-12 keywords that OpenAPI 3.1 and 3.2 add:

- `if`/`then`/`else`, `dependentRequired` and `dependentSchemas` become one `z.refine` check each. A `dependentRequired` key is checked for presence, so `{ creditCard: ['billingAddress'] }` fails when `creditCard` is set without `billingAddress`.
- `contains` with `minContains` and `maxContains` counts the matching items.
- A response that declares `headers` gets a schema for them, such as `listPetsStatus200HeadersSchema`. It describes the headers as the spec declares them, while a fetch `Headers` object has lowercase names and string values.
- A `2XX` status range counts as a success response, so it moves from `<name>ErrorSchema` to `<name>ResponseSchema`.

The printers read the new `min`, `max` and `exclusive` fields instead of the deprecated `minProperties`, `maxProperties`, `exclusiveMinimum` and `exclusiveMaximum`. A custom node that only sets the deprecated fields loses those checks.
