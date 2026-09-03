---
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Fix the generated client failing to type-check in Node-only projects (`@types/node` without the `dom` lib). The generated `.kubb/client.ts` and `.kubb/serializers.ts` no longer reference the global `BodyInit` name, which such a project never declares. They now use a local `RequestBody` type derived from `RequestInit['body']`.
