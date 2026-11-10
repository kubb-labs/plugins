---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Use the OpenAPI 3.2 fields in the clients:

- A cookie parameter with `style: cookie` is sent without percent-encoding, as RFC 6265 describes, and `explode` defaults to `true` for it. A value with a character the style cannot send, such as `;`, throws a `TypeError`. Other cookie parameters keep the `form` style.
- A status range such as `2XX` counts as a success response.
- JSDoc gains `@see` from an operation's `externalDocs`.

The operation's `servers` now come from the AST instead of the raw document, with the same result.
