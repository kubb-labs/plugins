---
'@kubb/plugin-faker': minor
'@kubb/plugin-msw': minor
---

Mock exclusive bounds in Faker, and response headers and spec examples in MSW.

- Faker keeps a number inside `exclusiveMinimum` and `exclusiveMaximum`.
- Faker fills in the other bound when its default contradicts a lone one. `minimum: 5` on a number used to throw.
- MSW mocks a `2XX` range as a `200` response.
- MSW sends each declared response header that has an `example` or a `default`.
- With `parser: 'data'`, an MSW handler called without `data` sends the response's first spec example.
