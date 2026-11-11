---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Write the `label` and `matrix` path styles into `.kubb/serializers/pathStyles.ts` only when the spec has such a path parameter. `.kubb/client.ts` then sets `serializer.path` to its `serializePath`. The default path serializer handles `simple` and throws on another style.
