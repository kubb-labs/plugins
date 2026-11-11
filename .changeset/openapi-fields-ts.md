---
'@kubb/plugin-ts': minor
---

Type the response headers, and print more of the spec as JSDoc.

- Add a type for a response's `headers`, such as `ListPetsStatus200Headers`, named by `resolver.response.headers`.
- Type `ListPetsResponse` as the body of a `2XX` range, not as the union of every response.
- Print `@see` from `externalDocs`, `@deprecated` and `@example` on parameters, `@example` from a media type, and `@summary` and links on a response.
- Print an example's `serializedValue` as a second `@example` under a `Serialized` caption.
- Stop printing an object's `minProperties` and `maxProperties` as `@minLength` and `@maxLength`.
