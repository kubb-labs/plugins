---
'@kubb/plugin-ts': minor
---

Use the OpenAPI 3.1 and 3.2 fields the adapter reads since Kubb 5.18:

- A response that declares `headers` gets a type for them, such as `ListPetsStatus200Headers`, named by the new `resolver.response.headers`.
- A status range such as `2XX` counts as a success response, so `ListPetsResponse` is its body instead of the union of every response.
- JSDoc gains `@see` from `externalDocs`, `@deprecated` and `@example` on parameters, `@example` from a media type's `examples` on request and response types, with a `serializedValue` as a second `@example` under a `Serialized` caption, and `@summary` plus one `@see` per link on a response type.
- An object's `minProperties` and `maxProperties` no longer print as `@minLength` and `@maxLength`. No JSDoc tag describes them.
