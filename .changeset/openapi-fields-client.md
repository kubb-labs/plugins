---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Use the OpenAPI 3.2 fields in the clients:

- A cookie parameter with `style: cookie` is sent without percent-encoding, as RFC 6265 describes, and `explode` defaults to `true` for it. A value with a character the style cannot send, such as `;`, throws a `TypeError`. Other cookie parameters keep the `form` style.
- A status range such as `2XX` counts as a success response.
- JSDoc gains `@see` from an operation's `externalDocs`.
- Every result carries the response's `Headers` as `headers`. `RequestResult` takes the declared response headers by status as an optional last type argument, and an operation whose responses declare headers returns `RequestResultWithHeaders<ListPetsResponses, { '200': ListPetsStatus200Headers }>`, so `headers.get` suggests the declared names for the narrowed status.
- An `oauth2` entry in `security` carries its `flows` with their URLs and its `metadataUrl`, and an `openIdConnect` entry its discovery `url`, so an `auth` resolver can run a flow such as the 3.2 `deviceAuthorization` flow.
- `.kubb/client.ts` exports the servers that have a 3.2 `name` as `servers`, for `client.setConfig({ baseURL: servers.staging })`.
- A `multipart/mixed` body is sent as one part per array item, each with its media type from `prefixEncoding` and `itemEncoding`.

The operation's `servers` now come from the AST instead of the raw document. `server.index` counts the servers the adapter keeps, which leaves out a server without a `url`.

A custom client from `@kubb/plugin-client` keeps its two-argument `RequestResult`, so its results get no typed headers. Generated calls can now pass `flows`, `metadataUrl` and `url` in a `security` entry and `style: 'cookie'` in `styles`, so a client that types these fields strictly stops compiling after it regenerates. Widen them the way the "Write your client" guide shows.
