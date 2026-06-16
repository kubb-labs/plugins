---
"@kubb/plugin-fetch": minor
---

Add `@kubb/plugin-fetch`, a slim HTTP client plugin pinned to the Fetch API. Each operation becomes one async function that takes a single grouped `options` object and returns the shared `RequestResult` contract, with a per-call `throwOnError` flag (default `true`):

- `throwOnError: true` (default): a non-2xx status throws `ResponseError` and `data` is always defined.
- `throwOnError: false`: errors are returned as values, discriminated by `error`.

The runtime is always bundled into `.kubb/client.ts`, so generated code never imports from `@kubb/plugin-fetch` and the only runtime dependency is the global `fetch`. A default `client` and a `createClient` factory are exported from the generated output; swap or extend the transport through the client config (`client.setConfig({ transport })`).

Options: `output`, `group`, `include`/`exclude`/`override`, `baseURL`, `parser` (zod, success bodies only), and `macros`.
