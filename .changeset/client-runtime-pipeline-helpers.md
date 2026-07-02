---
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Restructure the bundled client runtime so the send path reads as a short pipeline. Request resolution (headers, content type, auth, cookies, body) and response settlement (codec decode, validation, `throwOnError`) now live in focused helpers instead of one long closure, and `getUrl` shares the serializer resolution with the send path. Behavior and the public surface of `.kubb/client.ts` are unchanged, and a new test keeps the shared `serializers.ts` and `standardSchema.ts` templates byte-identical across both plugins.
