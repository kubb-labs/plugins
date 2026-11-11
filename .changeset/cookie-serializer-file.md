---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Write the cookie serializer into `.kubb/serializers/cookies.ts` only when the spec has a cookie parameter.

- `serializer.cookie` is a new config key, and `.kubb/client.ts` sets it to `serializeCookies` for such a spec.
- `serializeCookies` is gone from `.kubb/serializers.ts`. A call that passes `cookies` without a cookie serializer throws.
- `setConfig({ serializer })` now merges per key, so setting `serializer.query` keeps the cookie serializer.
