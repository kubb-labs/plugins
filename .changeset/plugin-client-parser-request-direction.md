---
'@kubb/plugin-client': minor
'@kubb/plugin-react-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-vue-query': patch
'@internals/tanstack-query': patch
---

**plugin-client**: extend `parser` option to support per-direction Zod validation.

The `parser` option now accepts an object form `{ request?: 'zod'; response?: 'zod' }` in addition to the existing `false | 'zod'` shorthand.

- `parser: 'zod'` keeps existing behavior, validating response bodies and request bodies via `@kubb/plugin-zod` schemas.
- `parser: { request: 'zod' }` validates the request body and query parameters before the call. Use this for coercion (`z.coerce.number()` converts stringified query parameters to numbers).
- `parser: { response: 'zod' }` validates response bodies only.
- `parser: { request: 'zod', response: 'zod' }` validates all directions, including query parameters.

Generated call site with `parser: { request: 'zod', response: 'zod' }`:

```ts
const requestData = createVehicleDataSchema.parse(data)
const requestParams = listVehiclesQueryParamsSchema.parse(params)
const res = await request({ data: requestData, params: requestParams, ... })
return listVehiclesResponseSchema.parse(res.data)
```

Operations without query params skip the `requestParams` line.

plugin-react-query, plugin-swr, and plugin-vue-query pass the new option shape through unchanged.
