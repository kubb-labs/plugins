---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Register every serializer through the client config, so the core imports none.

- Kubb writes `.kubb/config.ts` with the media types and serializers a spec needs, and `.kubb/client.ts` passes it to `setConfig`. The imports that were in the `client.ts` footer move there, so they follow the import extension of the TypeScript parser.
- The serializers live in `.kubb/serializers/`: `query.ts` or `queryStyles.ts`, `path.ts` and `pathStyles.ts`, `headers.ts`, and `cookies.ts`. `defaultQuerySerializer`, `defaultPathSerializer` and `applyHeaderStyles` are gone from `.kubb/serializers.ts`.
- `serializer.header` is a new config key. Kubb sets it for a spec with a header parameter.
- A client built with `createClientCore` and no `serializer` throws on a call with path or query parameters. Pass the serializers in its config.
