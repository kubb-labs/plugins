---
"@kubb/plugin-msw": patch
---

Fix MSW handlers for bodyless responses calling a zero-parameter Faker factory with an argument, which failed to type-check. The handler now skips the Faker call and the `Content-Type: application/json` header for responses with no declared content.
