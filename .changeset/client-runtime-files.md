---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Write a serializer, form media type or security scheme into `.kubb/` only where the spec needs it, and register the serializers through the client config.

- Kubb writes `.kubb/config.ts` with the media types and serializers a spec needs, and `.kubb/client.ts` passes it to `setConfig`. `setConfig({ serializer })` now merges per key.
- The serializers live in `.kubb/serializers/`: `query.ts` or `queryStyles.ts`, `path.ts` and `pathStyles.ts`, `headers.ts`, and `cookies.ts`. `queryStyles.ts`, `pathStyles.ts` (`label` and `matrix`) and `cookies.ts` are written only for a spec with such a parameter, and `queryStyles.ts` also for a urlencoded body.
- `serializer.header` and `serializer.cookie` are new config keys. A default serializer throws on a style it does not handle, and a call that passes `cookies` without a cookie serializer throws.
- `defaultQuerySerializer`, `defaultPathSerializer` and `applyHeaderStyles` are now `serializeQuery`, `serializePath` and `serializeHeaders`. `serializeCookies` and `serializeUrlencodedBody` are gone from `.kubb/serializers.ts`.
- `multipart/form-data`, `multipart/mixed`, and `application/x-www-form-urlencoded` each have their own file in `.kubb/mediaTypes/`, written only when the spec has a body of that type. `formMediaTypes` is gone from `.kubb/mediaTypes.ts`. Import `multipartFormData`, `multipartMixed`, or `urlencoded` from its file.
- Each security scheme is written once, as `securitySchemes` in `.kubb/client.ts`, and an operation points at it there. The `auth` resolver gets the same object as before.
- A client built with `createClientCore` and no `serializer` throws on a call with path or query parameters. Pass the serializers in its config.
