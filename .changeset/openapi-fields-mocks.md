---
'@kubb/plugin-faker': minor
'@kubb/plugin-msw': minor
---

Mock the OpenAPI 3.1 and 3.2 fields:

- Faker puts `minContains` items that match `contains` first in an array, and fills a string with `contentMediaType: application/json` and a `contentSchema` with `JSON.stringify` of that schema's mock, base64-encoded when `contentEncoding` says so.
- Faker keeps integers inside `exclusiveMinimum` and `exclusiveMaximum`, and uses them as a float's bounds. When one bound is set and faker's default for the other would contradict it, such as `minimum: 5` on a number, which used to throw, the other bound is filled in.
- MSW mocks a `2XX` success range as a `200` response with its body, and sends each declared response header that has an `example` or a `default`, using an example's `serializedValue` as the header value.
- With `parser: 'data'`, a handler called without `data` sends the success response's first example from the spec.
