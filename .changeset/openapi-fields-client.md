---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Return the response headers on every result, and support the OpenAPI 3.2 cookie style and named servers.

- Return the response's `Headers` as `headers` on every result and on a thrown `ResponseError`. For a response that declares headers, `headers.get` suggests their names once `status` is narrowed.
- Type the declared headers of a `text/event-stream` or JSON Lines response too. Such a call returns `StreamResultWithHeaders`, or `UnwrappedStreamResultWithHeaders` with `returnType: 'data'`, and `StreamResult`, `UnwrappedStreamResult` and `client.stream` take the headers record as an optional last type argument.
- Send a `style: cookie` parameter without percent-encoding, with `explode` on by default. A value it cannot send, such as one with `;`, throws a `TypeError`.
- Pass an `oauth2` scheme's `flows` and `metadataUrl`, and an `openIdConnect` scheme's `url`, to the `auth` resolver.
- Export the servers that have a `name` as `servers` from `.kubb/client.ts`.

```ts
import { client, servers } from './gen/.kubb/client'

client.setConfig({ baseURL: servers.staging })
```

`server.index` no longer counts a server without a `url`. A custom client (`importPath`) gets no typed headers. It must accept `flows`, `metadataUrl` and `url` in a `security` entry and `style: 'cookie'` in `styles`, as the "Write your client" guide shows.
