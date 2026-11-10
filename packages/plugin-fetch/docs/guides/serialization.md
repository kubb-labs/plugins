# Configure serialization

The generated client encodes parameters by their OpenAPI `style` and `explode`, and encodes and decodes bodies by their media type. Each generated operation carries its parameter styles and content types, so most requests need no extra setup.

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

To replace these defaults, override `serializer.query` or `serializer.path` on the client. Omitted functions keep their defaults:

```typescript
import { client } from './gen/.kubb/client'
import qs from 'qs'

client.setConfig({
  serializer: {
    query: (params) => qs.stringify(params, { arrayFormat: 'brackets' }),
  },
})
```

A serializer set this way runs for every call. Pass `serializer` on a single call to override only that request.

## Built-in media types

| Keys                                                                                     | Encodes                                           | Decodes                                    |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| `application/json`, `application/*+json`, `text/json`                                    | JSON                                              | JSON                                       |
| `text/*`                                                                                 | a string                                          | text                                       |
| `multipart/form-data`, `application/x-www-form-urlencoded`                               | `FormData` or `URLSearchParams` from an object    | `FormData`                                 |
| `multipart/mixed`                                                                        | one part per array item                           |                                            |
| `application/octet-stream`, `application/pdf`, `image/*`, `audio/*`, `video/*`           | a `Blob` as is                                    | `Blob`                                     |
| `text/event-stream`, `application/jsonl`, `application/x-ndjson`, `application/json-seq` |                                                   | text, or item by item with `client.stream` |
| `*/*`                                                                                    | JSON for objects, strings and binary bodies as is | JSON, or text when the body is not JSON    |

A `multipart/mixed` body is an array. Each part gets the media type of its position in the OpenAPI 3.2 `prefixEncoding`, then `itemEncoding`, which the generated call passes as `styles.parts`. Without one, a `Blob` keeps its own type, other binary data is `application/octet-stream`, a string is `text/plain`, and anything else is JSON.

`.kubb/client.ts` registers the form media types only when the document has a form body, and the stream media types only when it streams. They are exported as `formMediaTypes` from `.kubb/mediaTypes.ts` and `streamMediaTypes` from `.kubb/sse.ts`.

A key can be a pattern. The runtime lower-cases the type, drops its parameters, and tries the exact type, then a suffix such as `application/*+json`, then a wildcard such as `text/*`, then `*/*`. Write your own keys in lower case.

## Encode request bodies

When an operation declares one request content type, Kubb sets it on the generated function, so you pass only the body. For an operation that accepts more than one, set `contentType` on the call. A body without a content type is sent as `application/json`, unless it is already encoded.

Bodies that are already encoded (`FormData`, `URLSearchParams`, `Blob`, `ArrayBuffer`, typed arrays, streams, and strings) pass through every built-in media type as they are. A string under a JSON media type is JSON-encoded.

> [!NOTE]
> When the body is `FormData`, the runtime removes any `Content-Type` header so the transport sets it with the multipart boundary.

An XML, YAML, or CSV media type has no built-in handler, so an object sent under one throws a `TypeError`. Pass the encoded body as a string, or register a media type. The generated body type is the schema, such as `Pet`, so a string body needs a cast: `body: xml as unknown as AddPetBodyXml`.

## Add a media type

Register a handler under its media type with `mediaTypes`. `encode` gets the body and a context with the full `contentType`, and returns what `fetch` can send. `decode` gets the `Response`, so a binary format can read bytes:

```typescript
import { client } from './gen/.kubb/client'
import { XMLBuilder, XMLParser } from 'fast-xml-parser'

client.setConfig({
  mediaTypes: {
    'application/xml': {
      encode: (body) => new XMLBuilder().build(body),
      decode: async (response) => new XMLParser().parse(await response.text()),
    },
  },
})
```

Handlers merge per key over the built-ins, over earlier `setConfig` calls, and, when passed on a single call, over the client ones. An entry with only `decode` still encodes through the next match, such as `*/*`.

A streaming format adds `stream`, which reads the 2xx body item by item. The runtime validates each item:

```typescript
client.setConfig({
  mediaTypes: {
    'multipart/mixed': { stream: (body, { contentType }) => readParts(body, boundaryOf(contentType)) },
  },
})
```

## Decode responses

The runtime decodes each body by the response `Content-Type`. The media type is on the result as `contentType`, so a `switch (result.contentType)` narrows `data` for an operation that returns more than one.

- A 2xx response without a `Content-Type` is decoded as the media type the call asked for in `contentType.response`, then as `*/*`.
- A 204, 205, or 304 response, a `HEAD` request, and an empty body give `data: undefined`.
- Invalid JSON under a JSON media type throws a `ParseError`. Catch it, or register a lenient `application/json` handler.

To skip the lookup for one call, set `parseAs` to `'json'`, `'text'`, `'blob'`, `'arrayBuffer'`, or `'stream'`. It applies to a 2xx body only. Kubb sets `parseAs: 'blob'` on an operation with only binary success content:

```typescript
const { data } = await getReport({ path: { id: '123' }, parseAs: 'text' })
```

The generated types follow what the built-in media types return. A response read as text, such as `application/xml`, `application/yaml`, or `text/csv`, is typed `string`, even when the document gives it an object schema. A vendor type such as `application/vnd.github.object` keeps its schema type, because the client parses its JSON body. A media type you register changes the value but not that type, so narrow or cast `data` to what it returns:

```typescript
const result = await getPetById({ path: { petId: 1 }, contentType: { response: 'application/xml' } })
if (result.contentType === 'application/xml') {
  const pet = result.data as unknown as Pet
}
```

[Server-sent events](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/server-sent-events) covers stream media types and `client.stream`.

> [!NOTE]
> With the adapter's default [`integerType: 'bigint'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype), a `format: int64` field is typed `bigint`, but `JSON.parse` returns a `number`. Set `integerType: 'number'` on `adapterOas`, or turn on [`validator: 'zod'`](#validate-responses), which converts the field to `bigint`. Either way, `JSON.parse` loses precision above `Number.MAX_SAFE_INTEGER`, so declare an exact 64-bit ID as a string in the document.

## Validate responses

Enable `validator` on the client plugin and register `pluginZod` in the same configuration. Validation is disabled by default.

```typescript
import { pluginFetch } from '@kubb/plugin-fetch'

pluginFetch({ validator: 'zod' })
```

`'zod'` validates the success response body and the error body. Use the object form to opt in per direction, where `request` validates the request body before the call goes out:

```typescript
pluginFetch({ validator: { request: 'zod', response: 'zod' } })
```

With a validator set, Kubb passes the matching schema to each generated call, and the runtime parses the decoded body through it. A body that does not match throws a `ParseError` with the schema's `issues`.
