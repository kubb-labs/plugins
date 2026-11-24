---
"@kubb/plugin-client": patch
"@kubb/plugin-fetch": patch
"@kubb/plugin-axios": patch
"@kubb/plugin-ky": patch
---

Fix two client runtime types that rejected code the runtime accepts. The client config `headers` now takes a `Headers` instance, and a request or response interceptor may return nothing to keep the value. Regenerate to get the new types.
