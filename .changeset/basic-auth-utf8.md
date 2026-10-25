---
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Encode HTTP Basic credentials as UTF-8 so non-ASCII usernames and passwords are sent correctly without throwing.
