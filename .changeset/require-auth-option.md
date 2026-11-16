---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Add the `requireAuth` option. When it is on, a generated function whose operation needs a security scheme takes `auth` as a required option, so a call without a token fails to compile. Operations without `security`, or that allow `{}`, keep `auth` optional.
