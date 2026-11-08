# Configure serialization

The generated client encodes parameters using OpenAPI `style` and `explode`, serializes request bodies by content type, and decodes responses by media type. Each generated operation carries its parameter styles and content types, so most requests need no extra setup.

## Override parameter serialization

Check the [default parameter styles and encoding](https://kubb.dev/docs/5.x/reference/serialization#parameter-styles) before replacing a serializer.

Override `serializer.query`, `.body`, or `.path` on the client. Omitted functions retain their defaults:

```typescript
import { client } from './gen/.kubb/client'
import qs from 'qs'

client.setConfig({
  serializer: {
    query: (params) => qs.stringify(params, { arrayFormat: 'brackets' }),
  },
})
```

A serializer set this way runs for every call, but you can pass `serializer` on a single call to
override only that request.

## Encode request bodies

The request content type decides how the body is encoded. The default serializer handles the
common types: a plain object becomes JSON, `multipart/form-data` becomes `FormData`, and
`application/x-www-form-urlencoded` becomes `URLSearchParams`. Binary and already-encoded bodies
(`FormData`, `URLSearchParams`, `Blob`, `ArrayBuffer`, typed arrays, and strings) pass through
untouched.

When an operation declares a single request content type, Kubb sets it on the generated function,
so you pass only the body. For an operation that accepts more than one, set `contentType` on the
call.

> [!NOTE]
> When the body is `FormData`, the runtime removes any `Content-Type` header so the transport sets
> it with the multipart boundary. You do not need to set `multipart/form-data` yourself, and a
> value you set is dropped for that request.

To encode a content type the default serializer does not handle, register a codec for that media
type. `codecs` is keyed by content type. Each entry takes a `serialize` for the request body, a
`deserialize` for the response, or both:

```typescript
import { client } from './gen/.kubb/client'
import { stringify } from 'yaml'

client.setConfig({
  codecs: {
    'application/yaml': { serialize: (body) => stringify(body) },
  },
})
```

## Decode responses

The runtime reads the response `Content-Type` and decodes the body by it: JSON is parsed, text
stays a string, and a binary type becomes a `Blob`. The negotiated media type is on the result as
`contentType`, so a `switch (result.contentType)` narrows `data` for an operation that returns
more than one.

When that success response declares several content types that do not share one parser, the
generated call sets `responseType` to a map from content type to parser, for example
`{ 'audio/mpeg': 'blob', 'text/event-stream': 'stream' }`. Axios reads the raw body, then the
runtime matches the response `Content-Type` against the map, including a `type/*` wildcard,
before the media-type heuristic. A schema with `format: binary` is a blob even when the media
type is not a well-known binary type.

Axios response interceptors see the decoded body: parsed JSON, a string, or a `Blob`. A map with
a `'stream'` entry reads the body as a stream, the same way as `responseType: 'stream'`, so an
event stream arrives as it is sent. Interceptors then see the stream, and the runtime reads any
other content type from it afterwards.

To decode a media type the runtime does not handle, register a codec's `deserialize` for it.
`deserialize` receives the raw body and the content type and returns the parsed value. It runs
before validation, so the schema checks the parsed value:

```typescript
import { client } from './gen/.kubb/client'

client.setConfig({
  codecs: {
    'application/xml': { deserialize: (raw) => new DOMParser().parseFromString(raw as string, 'application/xml') },
  },
})
```

Like the other config, `codecs` can also be passed on a single call, and a per-call entry merges
over the client one for that content type.

When the runtime picks the wrong parse mode because a response omits its `Content-Type` or sets a
misleading one, force the mode with `responseType` on the call. It accepts `'json'`, `'text'`,
`'blob'`, `'arraybuffer'`, `'document'`, and `'formdata'`:

```typescript
const { data } = await downloadInvoice({ path: { id: '123' }, responseType: 'blob' })
// data is a Blob even when the server leaves Content-Type unset
```

[Server-sent events](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/server-sent-events) covers `responseType: 'stream'`.

For bidirectional formats, supply both `serialize` and `deserialize` in the media type codec, then set the operation's request and response `contentType`.

## Validate responses

Enable `validator` on the client plugin and register `pluginZod` in the same configuration. Validation is disabled by default.

```typescript
import { pluginAxios } from '@kubb/plugin-axios'

pluginAxios({ validator: 'zod' })
```

`'zod'` validates the success response body, and the error body when a non-2xx call does not
throw. Use the object form to opt in per direction, where `request` validates the request
body before the call goes out:

```typescript
pluginAxios({ validator: { request: 'zod', response: 'zod' } })
```

With a validator set, Kubb passes the matching schema to each generated call, and the runtime
parses the body through it. A body that does not match throws a `ParseError` with the schema's
`issues`.
