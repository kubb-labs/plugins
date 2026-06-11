---
"@kubb/plugin-zod": patch
---

Generate `<operation>ResponseSchema` from success (2xx) responses only, fixing kubb-labs/plugins#369.

The response schema validates resolved (non-throwing) response data, so error responses (4xx/5xx) no longer fold into the union. With `pluginClient({ parser: 'zod' })`, `data` now parses against the success schema, matching the `request<TData, TError>` split the client already makes. When a spec declares no 2xx response with a schema (for example only `default`), the schema falls back to the previous union of all responses.
