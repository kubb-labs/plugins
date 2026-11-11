---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Write a serializer or form media type into `.kubb/` only when the spec needs it.

- Kubb writes `.kubb/config.ts` with the serializers and media types of the spec, and `setConfig({ serializer })` merges per key.
- The serializers live in `.kubb/serializers/`. `defaultQuerySerializer`, `defaultPathSerializer` and `applyHeaderStyles` are now `serializeQuery`, `serializePath` and `serializeHeaders`, and `serializer.header` and `serializer.cookie` are new config keys.
- The form media types live in `.kubb/mediaTypes/` as `multipartFormData`, `multipartMixed` and `urlencoded`. `formMediaTypes` is gone.
- Each security scheme is written once, as `securitySchemes` in `.kubb/client.ts`.
- A client built with `createClientCore` needs its serializers passed in `serializer`.
