# Configure serialization

The generated client encodes parameters using OpenAPI `style` and `explode`, serializes request bodies by content type, and decodes responses by media type. Each generated operation carries its parameter styles and content types, so most requests need no extra setup.

## Parameter styles

A parameter without `style` or `explode` in the spec uses the default for its location.

### Query

Query parameters default to the `form` style. Arrays explode into repeated keys unless the spec
says otherwise, and `spaceDelimited`, `pipeDelimited`, and `deepObject` change how arrays and
objects collapse.

| Style            | `explode` | Input               | Result           |
| ---------------- | --------- | ------------------- | ---------------- |
| `form` (default) | `true`    | `{ id: [3, 4, 5] }` | `id=3&id=4&id=5` |
| `form`           | `false`   | `{ id: [3, 4, 5] }` | `id=3,4,5`       |
| `spaceDelimited` | `false`   | `{ id: [3, 4, 5] }` | `id=3%204%205`   |
| `pipeDelimited`  | `false`   | `{ id: [3, 4, 5] }` | `id=3\|4\|5`     |
| `deepObject`     | `n/a`     | `{ a: { b: 1 } }`   | `a%5Bb%5D=1`     |

With `explode: true`, `spaceDelimited` and `pipeDelimited` fall back to repeated keys like `form`,
so the delimiter only shows with `explode: false`.

### Path

Path parameters default to the `simple` style, which emits the bare value. `label` prefixes a
`.` and `matrix` prefixes a `;name=` segment. The results below are the serialized segment for a
parameter named `id`.

| Style              | `explode` | Input            | Result            |
| ------------------ | --------- | ---------------- | ----------------- |
| `simple` (default) | `false`   | `[3, 4, 5]`      | `3,4,5`           |
| `label`            | `true`    | `[3, 4, 5]`      | `.3.4.5`          |
| `matrix`           | `true`    | `[3, 4, 5]`      | `;id=3;id=4;id=5` |
| `simple`           | `false`   | `{ x: 1, y: 2 }` | `x,1,y,2`         |

### Header and cookie

Header parameters use the `simple` style and cookie parameters use the `form` style. Both fix the
style and only let `explode` vary, so the metadata for these locations carries `explode` alone.
Header values are sent as-is, and cookie values are URL-encoded into a single `Cookie` header.

| Location | `explode` | Input                             | Result                 |
| -------- | --------- | --------------------------------- | ---------------------- |
| header   | `false`   | `[3, 4]`                          | `X-Ids: 3,4`           |
| header   | `true`    | `{ role: 'admin' }`               | `X-Filter: role=admin` |
| cookie   | `false`   | `{ session: 'abc', ids: [1, 2] }` | `session=abc; ids=1,2` |
| cookie   | `true`    | `{ ids: [1, 2] }`                 | `ids=1; ids=2`         |

## Override parameter serialization

To replace these defaults, override `serializer.query`, `.body`, or `.path` on the client. Omitted functions retain their defaults:

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

The default serializer sends any other object as JSON, except for XML, YAML, and CSV types. For
those, an object throws a `TypeError`, so pass the encoded body as a string or register a codec.

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
`{ 'audio/mpeg': 'blob', 'text/event-stream': 'stream' }`. The runtime matches the response
`Content-Type` against the map, including a `type/*` wildcard, before the media-type heuristic.
A schema with `format: binary` is a blob even when the media type is not a well-known binary type.

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

The generated types follow what the runtime returns without a codec. A response the runtime reads
as text, such as `application/xml`, `application/yaml`, or `text/csv`, is typed `string`, even
when the document gives it an object schema. A `deserialize` changes the value but not that type,
so cast or narrow `data` to what your codec returns:

```typescript
const result = await getPetById({ path: { petId: 1 }, contentType: { response: 'application/xml' } })
if (result.contentType === 'application/xml') {
  const pet = result.data as unknown as Document
}
```

When the runtime picks the wrong parse mode because a response omits its `Content-Type` or sets a
misleading one, force the mode with `responseType` on the call. It accepts `'json'`, `'text'`,
`'blob'`, `'arraybuffer'`, and `'document'`:

```typescript
const { data } = await downloadInvoice({ path: { id: '123' }, responseType: 'blob' })
// data is a Blob even when the server leaves Content-Type unset
```

[Server-sent events](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/server-sent-events) covers `responseType: 'stream'`.

> [!NOTE]
> With the adapter's default [`integerType: 'bigint'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype), a `format: int64` field is typed `bigint`, but `JSON.parse` returns a `number`. Set `integerType: 'number'` on `adapterOas`, or turn on [`validator: 'zod'`](#validate-responses), which converts the field to `bigint`. Either way, `JSON.parse` loses precision above `Number.MAX_SAFE_INTEGER`, so declare an exact 64-bit ID as a string in the document.

For bidirectional formats, supply both `serialize` and `deserialize` in the media type codec, then set the operation's request and response `contentType`.

## Validate responses

Enable `validator` on the client plugin and register `pluginZod` in the same configuration. Validation is disabled by default.

```typescript
import { pluginFetch } from '@kubb/plugin-fetch'

pluginFetch({ validator: 'zod' })
```

`'zod'` validates the success response body, and the error body when a non-2xx call does not
throw. Use the object form to opt in per direction, where `request` validates the request
body before the call goes out:

```typescript
pluginFetch({ validator: { request: 'zod', response: 'zod' } })
```

With a validator set, Kubb passes the matching schema to each generated call, and the runtime
parses the body through it. A body that does not match throws a `ParseError` with the schema's
`issues`.
