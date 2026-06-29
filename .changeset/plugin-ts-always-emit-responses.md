---
"@kubb/plugin-ts": patch
---

Always emit a `*Responses` type for every operation, even when it declares no responses. The type now renders as an empty `object` instead of being skipped, so consumers that import it unconditionally (such as the axios SDK's `RequestResult<XResponses>`) keep resolving instead of failing strict typecheck with `TS2305: Module has no exported member 'XResponses'`. Reported in kubb-labs/plugins#567.
