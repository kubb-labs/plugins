---
"@kubb/plugin-client": patch
---

Serialize object header values to JSON in the generated `fetch` and `axios` clients so headers like `X-Filter` (which OpenAPI specs declare as a JSON object) are sent in their canonical form instead of being coerced to `[object Object]` by the runtime. `RequestConfig.headers` now widens to a shared `HeadersInit` type that accepts primitive and object values, matching what spec authors actually pass.

A new `serializeHeaders()` helper turns non-string values into JSON before they reach `globalThis.fetch` or `axios.request`. Existing string-valued headers behave unchanged.
