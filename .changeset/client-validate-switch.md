---
"@kubb/plugin-axios": minor
"@kubb/plugin-fetch": minor
---

Add a `validate` setting to the generated client, so `client.setConfig({ validate: false })` skips generated validation at runtime. An object such as `{ response: false }` skips only those directions, and a per-call `validate` overrides the client setting. The default stays `true`.
