---
"@kubb/plugin-client": patch
---

Serialize object header values to JSON in the generated `fetch` client so headers like `X-Filter` (which OpenAPI specs declare as a JSON object) are sent in their canonical form instead of being coerced to `[object Object]` by the runtime. The `RequestConfig.headers` type also widens from `Record<string, string>` to accept primitive and object values, matching what spec authors actually pass.

A new `serializeHeaders()` helper turns non-string values into JSON before they reach `globalThis.fetch`. Existing string-valued headers behave unchanged.
