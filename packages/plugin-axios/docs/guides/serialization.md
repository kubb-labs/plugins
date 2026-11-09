# Configure serialization

The generated client encodes parameters by their OpenAPI `style` and `explode`, and encodes and decodes bodies by their media type. Each generated operation carries its parameter styles and content types, so most requests need no extra setup.

## Override parameter serialization

Check the [default parameter styles and encoding](https://kubb.dev/docs/5.x/reference/serialization#parameter-styles) before replacing a serializer.

Override `serializer.query` or `serializer.path` on the client. Omitted functions keep their defaults:

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
| `application/octet-stream`, `application/pdf`, `image/*`, `audio/*`, `video/*`           | a `Blob` as is                                    | `Blob`                                     |
| `text/event-stream`, `application/jsonl`, `application/x-ndjson`, `application/json-seq` |                                                   | text, or item by item with `client.stream` |
| `*/*`                                                                                    | JSON for objects, strings and binary bodies as is | JSON, or text when the body is not JSON    |

`.kubb/client.ts` registers the form media types only when the document has a form body, and the stream media types only when it streams. They are exported as `formMediaTypes` from `.kubb/mediaTypes.ts` and `streamMediaTypes` from `.kubb/sse.ts`.

A key can be a pattern. The runtime lower-cases the type, drops its parameters, and tries the exact type, then a suffix such as `application/*+json`, then a wildcard such as `text/*`, then `*/*`. Write your own keys in lower case.

## Encode request bodies

When an operation declares one request content type, Kubb sets it on the generated function, so you pass only the body. For an operation that accepts more than one, set `contentType` on the call. A body without a content type is sent as `application/json`, unless it is already encoded.

Bodies that are already encoded (`FormData`, `URLSearchParams`, `Blob`, `ArrayBuffer`, typed arrays, streams, and strings) pass through every built-in media type as they are. A string under a JSON media type is JSON-encoded.

> [!NOTE]
> When the body is `FormData`, the runtime removes any `Content-Type` header so the transport sets it with the multipart boundary.

An XML, YAML, or CSV media type has no built-in handler, so an object sent under one throws a `TypeError`. Pass the encoded body as a string, or register a media type.

## Add a media type

Register a handler under its media type with `mediaTypes`. `encode` gets the body and a context with the full `contentType`, and returns a body axios can send. `decode` gets the `Response`, so a binary format can read bytes:

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

The runtime decodes each body by the response `Content-Type`, after axios reads it as bytes. Native axios response interceptors on `getAxiosInstance()` see those bytes, so use `client.interceptors.response` to see the decoded body. The media type is on the result as `contentType`, so a `switch (result.contentType)` narrows `data` for an operation that returns more than one.

- A 2xx response without a `Content-Type` is decoded as the media type the call asked for in `contentType.response`, then as `*/*`.
- A 204, 205, or 304 response, a `HEAD` request, and an empty body give `data: undefined`.
- Invalid JSON under a JSON media type throws a `ParseError`. Catch it, or register a lenient `application/json` handler.

To skip the lookup for one call, set `parseAs` to `'json'`, `'text'`, `'blob'`, `'arrayBuffer'`, or `'stream'`. It applies to a 2xx body only. Kubb sets `parseAs: 'blob'` on an operation with only binary success content:

```typescript
const { data } = await getReport({ path: { id: '123' }, parseAs: 'text' })
```

The generated types follow what the built-in media types return. A response read as text, such as `application/xml`, `application/yaml`, or `text/csv`, is typed `string`, even when the document gives it an object schema. A media type you register changes the value but not that type, so narrow or cast `data` to what it returns:

```typescript
const result = await getPetById({ path: { petId: 1 }, contentType: { response: 'application/xml' } })
if (result.contentType === 'application/xml') {
  const pet = result.data as unknown as Pet
}
```

[Server-sent events](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/server-sent-events) covers stream media types and `client.stream`.

> [!NOTE]
> With the adapter's default [`integerType: 'bigint'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype), a `format: int64` field is typed `bigint`, but `JSON.parse` returns a `number`. Set `integerType: 'number'` on `adapterOas`, or turn on [`validator: 'zod'`](#validate-responses), which converts the field to `bigint`. Either way, `JSON.parse` loses precision above `Number.MAX_SAFE_INTEGER`, so declare an exact 64-bit ID as a string in the document.

## Validate responses

Enable `validator` on the client plugin and register `pluginZod` in the same configuration. Validation is disabled by default.

```typescript
import { pluginAxios } from '@kubb/plugin-axios'

pluginAxios({ validator: 'zod' })
```

`'zod'` validates the success response body and the error body. Use the object form to opt in per direction, where `request` validates the request body before the call goes out:

```typescript
pluginAxios({ validator: { request: 'zod', response: 'zod' } })
```

With a validator set, Kubb passes the matching schema to each generated call, and the runtime parses the decoded body through it. A body that does not match throws a `ParseError` with the schema's `issues`.
