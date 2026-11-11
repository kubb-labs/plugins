---
'@kubb/plugin-zod': minor
---

Add a schema for response headers, check the JSON Schema 2020-12 keywords, and fix exclusive bounds in zod/mini.

- Add a schema for a response's `headers`, such as `listPetsStatus200HeadersSchema`. It holds the spec's types, so it does not parse a fetch `Headers` object.
- Move a `2XX` range from `<name>ErrorSchema` to `<name>ResponseSchema`.
- Print `exclusiveMinimum` and `exclusiveMaximum` as `z.gt` and `z.lt` in zod/mini. The old output did not compile.
- Check `if`/`then`/`else`, `dependentRequired` and `dependentSchemas` with one `z.refine` each. A `dependentRequired` key is checked for presence, so `{ creditCard: ['billingAddress'] }` fails when `creditCard` is set without `billingAddress`.
- Count the items that match `contains`, within `minContains` and `maxContains`.
- Check `propertyNames` on an object that also declares `properties` or `patternProperties`. It used to be checked only on a map.
- Read `min`, `max` and `exclusive` on a custom node. The deprecated `minProperties`, `maxProperties`, `exclusiveMinimum` and `exclusiveMaximum` still work when the new field is not set.
