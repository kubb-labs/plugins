---
"@kubb/plugin-zod": minor
---

Fix `<operation>ResponseSchema` validating the response body against a union of every status code. The schema now covers success (2xx) bodies only, matching the `request<…>` generic that already separates success from error. Multiple 2xx responses produce a union of just those success schemas, and an operation with no documented 2xx schema falls back to `z.unknown()`. Error (4xx/5xx/default) bodies are no longer folded into the success schema; they stay typed by plugin-ts and are surfaced unparsed.

This is the response-validation half of the client plugins' `parser: 'zod'` contract (plugin-fetch, plugin-axios). Fixes #369.
