---
'@kubb/plugin-faker': minor
'@kubb/plugin-msw': minor
---

Mock the OpenAPI 3.1 and 3.2 fields:

- Faker keeps integers inside `exclusiveMinimum` and `exclusiveMaximum`, and uses them as a float's bounds. When one bound is set and faker's default for the other would contradict it, such as `minimum: 5` on a number, which used to throw, the other bound is filled in.
- MSW mocks a `2XX` success range as a `200` response with its body, and sends each declared response header that has an `example` or a `default`, using an example's `serializedValue` as the header value.
- With `parser: 'data'`, a handler called without `data` sends the success response's first example from the spec.
