---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Write each security scheme once, as `securitySchemes` in `.kubb/client.ts`. A generated fetch or axios operation points at its scheme there, so the OAuth2 flow URLs are no longer repeated in every secured operation. The `auth` resolver gets the same object as before.
