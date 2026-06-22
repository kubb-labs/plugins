---
"@kubb/plugin-fetch": minor
---

Emit per-operation security metadata derived from the OpenAPI spec. Each generated call now carries a `security` array (the operation's requirements, falling back to the global `security`) and a `schemes` map resolved from `components.securitySchemes`, so the runtime `auth()` callback can place bearer, basic, and apiKey (header/query) credentials without manual wiring. `oauth2` and `openIdConnect` reduce to bearer, and operations with no requirements emit nothing.
