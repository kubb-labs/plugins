---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-ky': minor
---

The generated client calls the `auth` callback again before each retry and each reopen of an event stream, so a token that expired during the wait is replaced. Regenerate to get the new `.kubb/core.ts`.

- A static `auth` string is resolved once, since it cannot change between attempts.
- A header or URL that a request interceptor or an `onRetry` hook changed is left as they set it.
