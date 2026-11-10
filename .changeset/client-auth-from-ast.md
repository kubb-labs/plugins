---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Build each call's `security` from the auth schemes and requirements the adapter puts in the AST, instead of from the raw OpenAPI document. An OpenAPI 3.2 requirement that names a scheme by URI now resolves, and a `mutualTLS` scheme stays out of `security`, since the runtime cannot send it.
