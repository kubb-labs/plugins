---
"@kubb/plugin-axios": minor
---

Add `@kubb/plugin-axios`, a slim HTTP client plugin pinned to axios. Each operation becomes one async function that takes a single grouped `options` object and returns the shared `RequestResult` contract, with a per-call `throwOnError` flag (default `true`):

- `throwOnError: true` (default): a non-2xx status throws `ResponseError` (normalized from the rejected axios error) and `data` is always defined.
- `throwOnError: false`: maps to an internal `validateStatus: () => true` (a user-provided `validateStatus` wins) and returns errors as values, discriminated by `error`.

The runtime is always bundled into `.kubb/client.ts`, so generated code never imports from `@kubb/plugin-axios` and the only runtime dependency is `axios`. A default `client` and a `createClient` factory are exported from the generated output. The `transport` config field takes an axios instance (default `axios.create()`), so you can bring an instance that already carries interceptors, retry adapters, or proxy config. Interceptors delegate to axios's native `interceptors.request`/`interceptors.response`, and `querySerializer`/`bodySerializer` map onto axios's `paramsSerializer`/`transformRequest`; `request`/`response` on the result are the axios request config and `AxiosResponse`.

Options: `output`, `group`, `include`/`exclude`/`override`, `baseURL`, `parser` (zod, success bodies only), and `macros`.
