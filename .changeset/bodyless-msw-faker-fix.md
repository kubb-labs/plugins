---
'@kubb/plugin-msw': patch
---

Stop MSW handlers for bodyless responses from passing data to zero-parameter Faker factories. These responses also no longer include an inferred `Content-Type: application/json` header.
