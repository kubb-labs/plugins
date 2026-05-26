---
"@kubb/plugin-client": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-react-query": minor
---

**Breaking:** Client functions and TanStack mutation/query `TData` now reference the union of `2xx` response types only (e.g. `AddPetStatus200`) instead of the full response alias (`AddPetMutation` / `AddPetQueryResponse`), which previously also included `4xx`/`5xx` shapes.

This aligns the generated code with TanStack Query's contract that `TData` is the resolved success value while errors flow through `TError`. The previous behavior forced `as` casts at call sites because the success body was unioned with error bodies.

If your HTTP client returns non-`2xx` bodies as resolved data instead of throwing, narrow with a type guard at the call site or wrap the client to throw on error responses. Fixes [#16](https://github.com/kubb-labs/plugins/issues/16).
