---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Write the query styles into `.kubb/serializers/queryStyles.ts` only when the spec has a styled query parameter or a urlencoded body.

- `.kubb/client.ts` sets `serializer.query` to its `serializeQuery` for a spec with a styled query parameter. The default query serializer handles parameters without a style entry and throws on one that has it.
- `serializeUrlencodedBody` is gone from `.kubb/serializers.ts`. It now lives in `.kubb/mediaTypes/urlencoded.ts`.
