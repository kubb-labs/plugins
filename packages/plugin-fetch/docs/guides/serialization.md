# Configure serialization

Change how the generated client encodes parameters by their OpenAPI `style` and `explode`, and how it encodes and decodes bodies by media type. Each generated call carries its parameter styles and content types, so most specs need no setup.

## Parameter styles

A parameter without `style` or `explode` in the spec uses its location's default.

::tabs

:::tabs-item{label="Query"}

For a query parameter named `id`:

| Style            | `explode` | Input            | Sent             |
| ---------------- | --------- | ---------------- | ---------------- |
| `form` (default) | `true`    | `[3, 4, 5]`      | `id=3&id=4&id=5` |
| `form`           | `false`   | `[3, 4, 5]`      | `id=3,4,5`       |
| `form` (default) | `true`    | `{ a: 1, b: 2 }` | `a=1&b=2`        |
| `spaceDelimited` | `false`   | `[3, 4, 5]`      | `id=3%204%205`   |
| `pipeDelimited`  | `false`   | `[3, 4, 5]`      | `id=3%7C4%7C5`   |
| `deepObject`     | n/a       | `{ a: 1 }`       | `id%5Ba%5D=1`    |

`spaceDelimited` and `pipeDelimited` default `explode` to `false`. With `explode: true` they repeat the key, like `form`. A space in a value goes out as `%20`. With `allowReserved`, reserved characters stay as they are, except `#`, `&`, and `+`.

:::

:::tabs-item{label="Path"}

For a path parameter named `id`, the segment that replaces `{id}`:

| Style              | `explode` | Input            | Sent              |
| ------------------ | --------- | ---------------- | ----------------- |
| `simple` (default) | `false`   | `[3, 4, 5]`      | `3,4,5`           |
| `simple` (default) | `false`   | `{ x: 1, y: 2 }` | `x,1,y,2`         |
| `label`            | `true`    | `[3, 4, 5]`      | `.3.4.5`          |
| `matrix`           | `true`    | `[3, 4, 5]`      | `;id=3;id=4;id=5` |

:::

:::tabs-item{label="Header"}

Headers always use the `simple` style. Only `explode` varies, and values are sent as they are.

| `explode`         | Input                           | Sent                   |
| ----------------- | ------------------------------- | ---------------------- |
| `false` (default) | `'X-Ids': [3, 4]`               | `X-Ids: 3,4`           |
| `false` (default) | `'X-Filter': { role: 'admin' }` | `X-Filter: role,admin` |
| `true`            | `'X-Filter': { role: 'admin' }` | `X-Filter: role=admin` |

:::

:::tabs-item{label="Cookie"}

Cookies use the `form` style, or the OpenAPI 3.2 `cookie` style. The input is the call's `cookies` object, joined into one `Cookie` header.

| Style            | `explode` | Input                             | Sent                   |
| ---------------- | --------- | --------------------------------- | ---------------------- |
| `form` (default) | `false`   | `{ session: 'abc', ids: [1, 2] }` | `session=abc; ids=1,2` |
| `form`           | `true`    | `{ ids: [1, 2] }`                 | `ids=1; ids=2`         |
| `cookie`         | `true`    | `{ ids: [1, 2] }`                 | `ids=1; ids=2`         |

`form` percent-encodes values. `cookie` sends them as they are, and a value it cannot send, such as one with `;`, throws a `TypeError`.

:::

::

## Override parameter serialization

Kubb writes the serializers a spec needs into `.kubb/serializers/` and registers them in `.kubb/config.ts`:

| Key in `serializer` | File                                                           | Written for                    |
| ------------------- | -------------------------------------------------------------- | ------------------------------ |
| `query`             | `query.ts`, or `queryStyles.ts` with a styled query parameter  | every spec                     |
| `path`              | `path.ts`, plus `pathStyles.ts` with a `label` or `matrix` one | every spec                     |
| `header`            | `headers.ts`                                                   | a spec with a header parameter |
| `cookie`            | `cookies.ts`                                                   | a spec with a cookie parameter |

Set a key on the client to replace that serializer for every call, or on one call. The other keys keep theirs:

```typescript
import qs from 'qs'
import { client } from './gen/.kubb/client'

client.setConfig({
  serializer: { query: (params) => qs.stringify(params, { arrayFormat: 'brackets' }) },
})
```

A call that needs a serializer the spec did not register throws a `TypeError` that names it, such as `serializer.cookie`. Without `serializer.header`, an array or object header value goes out as JSON.

## Built-in media types

| Keys                                                                                     | Encodes                                           | Decodes                                    |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| `application/json`, `application/*+json`, `text/json`                                    | JSON                                              | JSON                                       |
| `text/*`                                                                                 | a string as is                                    | text                                       |
| `multipart/form-data`, `application/x-www-form-urlencoded`                               | `FormData` or `URLSearchParams` from an object    | `FormData`                                 |
| `application/octet-stream`, `application/pdf`, `image/*`, `audio/*`, `video/*`           | a `Blob` as is                                    | `Blob`                                     |
| `text/event-stream`, `application/jsonl`, `application/x-ndjson`, `application/json-seq` |                                                   | text, or item by item with `client.stream` |
| `*/*`                                                                                    | JSON for objects, strings and binary bodies as is | JSON, or text when the body is not JSON    |

`.kubb/client.ts` registers the form types only when the spec has a body of that type, from `.kubb/mediaTypes/formData.ts` and `.kubb/mediaTypes/urlencoded.ts`. It registers the stream types, `streamMediaTypes` in `.kubb/sse.ts`, only when the spec streams.

The runtime lower-cases a `Content-Type`, drops its parameters, and tries the exact type, then a suffix such as `application/*+json`, then a wildcard such as `text/*`, then `*/*`. Write your own keys in lower case.

## Encode request bodies

An operation with one request content type has it built in. For one with several, set `contentType` on the call. A body without a content type goes out as `application/json`, unless it is already encoded.

- An encoded body passes every built-in media type as is: `FormData`, `URLSearchParams`, `Blob`, `ArrayBuffer`, typed arrays, streams, and strings. Under a JSON media type, a string is JSON-encoded.
- For a `FormData` body, the runtime removes `Content-Type`, so the transport sets it with the multipart boundary.
- A `bigint` goes out as a JSON number. One past `Number.MAX_SAFE_INTEGER` throws a `TypeError` instead of losing precision.
- XML, YAML, and CSV have no built-in encoder, so an object under one throws a `TypeError`. Pass the encoded string, cast to the body type (`body: xml as unknown as AddPetBodyXml`), or add a media type.

## Add a media type

Register a handler under its media type in `mediaTypes`. `encode` gets the body and a context with the full `contentType`, and returns what `fetch` can send. `decode` gets the `Response`, so a binary format can read bytes:

```typescript
import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import { client } from './gen/.kubb/client'

client.setConfig({
  mediaTypes: {
    'application/xml': {
      encode: (body) => new XMLBuilder().build(body),
      decode: async (response) => new XMLParser().parse(await response.text()),
    },
  },
})
```

Handlers merge per key over the built-ins and over earlier `setConfig` calls, and a handler passed on one call merges over the client's. An entry with only `decode` still encodes through the next match, such as `*/*`. A streaming format adds `stream`, which reads a 2xx body item by item, and the runtime validates each item:

```typescript
client.setConfig({
  mediaTypes: { 'multipart/mixed': { stream: (body, { contentType }) => readParts(body, boundaryOf(contentType)) } },
})
```

## Decode responses

The runtime decodes each body by the response `Content-Type`. The result's `contentType` holds the media type, so a `switch (result.contentType)` narrows `data` for an operation that returns several.

| Response                                             | `data`                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| 2xx without a `Content-Type`                         | Decoded as the call's `contentType.response`, then `*/*`.             |
| 204, 205, or 304, a `HEAD` request, or an empty body | `undefined`                                                           |
| Invalid JSON under a JSON media type                 | Throws a `ParseError`.                                                |
| 2xx with `parseAs` set on the call                   | Read as `'json'`, `'text'`, `'blob'`, `'arrayBuffer'`, or `'stream'`. |

Kubb sets `parseAs: 'blob'` on an operation whose success content is only binary. Catch the `ParseError`, or register a lenient `application/json` handler.

The generated types follow what the built-in media types return. XML, YAML, and CSV responses are typed `string`, even with an object schema. A vendor type such as `application/vnd.github.object` keeps its schema type. A media type you register changes the value but not the type, so cast `data`:

```typescript
const result = await getPetById({ path: { petId: 1 }, contentType: { response: 'application/xml' } })
if (result.contentType === 'application/xml') {
  const pet = result.data as unknown as Pet
}
```

> [!NOTE]
> With the adapter's default [`integerType: 'bigint'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype), an `int64` field is typed `bigint`, but `JSON.parse` returns a `number`. Set `integerType: 'number'`, or turn on [`validator: 'zod'`](https://kubb.dev/extensions/kubb-labs/plugin-fetch/options#validator), which converts the field. `JSON.parse` loses precision above `Number.MAX_SAFE_INTEGER` either way, so declare an exact 64-bit ID as a string.

[Server-sent events](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/server-sent-events) covers the stream media types and `client.stream`.
