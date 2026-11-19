# Configure serialization

Configure how the generated Ky client serializes OpenAPI parameters and encodes request and response bodies by media type.

Each generated call carries its parameter styles and content types, so most specs need no setup.

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

`spaceDelimited` and `pipeDelimited` default `explode` to `false`. A space in a value goes out as `%20`.

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

Cookies use the `form` style, or the OpenAPI 3.2 `cookie` style, joined into one `Cookie` header.

| Style            | `explode` | Input                             | Sent                   |
| ---------------- | --------- | --------------------------------- | ---------------------- |
| `form` (default) | `false`   | `{ session: 'abc', ids: [1, 2] }` | `session=abc; ids=1,2` |
| `form`           | `true`    | `{ ids: [1, 2] }`                 | `ids=1; ids=2`         |
| `cookie`         | `true`    | `{ ids: [1, 2] }`                 | `ids=1; ids=2`         |

`form` percent-encodes values. `cookie` sends them as they are, and a value it cannot send, such as one with `;`, throws a `TypeError`.

:::

::

For `allowReserved` and `explode: true` on delimited styles, see [Delimited styles and allowReserved](#delimited-styles-and-allowreserved).

## Override parameter serialization

Set a `serializer` key on the client to replace that serializer for every call, or on one call. The keys are `query`, `path`, `header`, and `cookie`, and the other keys keep theirs:

```typescript
import qs from 'qs'
import { client } from './gen/.kubb/client'

client.setConfig({
  serializer: { query: (params) => qs.stringify(params, { arrayFormat: 'brackets' }) },
})
```

Kubb writes only the serializers a spec needs. See [Serializer files](#serializer-files) for which files it writes.

## Built-in media types

| Keys                                                                                     | Encodes                                           | Decodes                                    |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| `application/json`, `application/*+json`, `text/json`                                    | JSON                                              | JSON                                       |
| `text/*`                                                                                 | a string as is                                    | text                                       |
| `multipart/form-data`, `application/x-www-form-urlencoded`                               | `FormData` or `URLSearchParams` from an object    | `FormData`                                 |
| `application/octet-stream`, `application/pdf`, `image/*`, `audio/*`, `video/*`           | a `Blob` as is                                    | `Blob`                                     |
| `text/event-stream`, `application/jsonl`, `application/x-ndjson`, `application/json-seq` |                                                   | text, or item by item with `client.stream` |
| `*/*`                                                                                    | JSON for objects, strings and binary bodies as is | JSON, or text when the body is not JSON    |

The runtime matches the lower-cased type without its parameters: the exact type, then a suffix such as `application/*+json`, then a wildcard such as `text/*`, then `*/*`. Write your own keys in lower case.

## Encode request bodies

For an operation with several request content types, set `contentType` on the call. A body without a content type goes out as `application/json`, unless it is already encoded.

- An encoded body passes every built-in media type as is: `FormData`, `URLSearchParams`, `Blob`, `ArrayBuffer`, typed arrays, streams, and strings. Under a JSON media type, a string is JSON-encoded.
- For a `FormData` body, the runtime removes `Content-Type`, so the transport sets it with the multipart boundary.
- XML, YAML, and CSV have no built-in encoder, so an object under one throws a `TypeError`. Pass the encoded string, cast to the body type (`body: xml as unknown as AddPetBodyXml`), or add a media type.

For `bigint` bodies, see [`bigint` request bodies](#bigint-request-bodies).

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

Handlers merge per key over the built-ins. For the merge order, see [Media type merge order](#media-type-merge-order). A streaming format adds `stream`, which reads a 2xx body item by item, and the runtime validates each item:

```typescript
client.setConfig({
  mediaTypes: { 'multipart/mixed': { stream: (body, { contentType }) => readParts(body, boundaryOf(contentType)) } },
})
```

## Decode responses

The runtime decodes each body by the response `Content-Type`. A `switch (result.contentType)` narrows `data` for an operation that returns several media types.

| Response                                             | `data`                                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 204, 205, or 304, a `HEAD` request, or an empty body | `undefined`                                                                             |
| Invalid JSON under a JSON media type                 | Throws a `ValidationError`. Catch it, or register a lenient `application/json` handler. |
| 2xx with `parseAs` set on the call                   | Read as `'json'`, `'text'`, `'blob'`, `'arrayBuffer'`, or `'stream'`.                   |

For a 2xx without a `Content-Type`, see [Default content types](#default-content-types). For binary downloads and vendor types, see [Binary and vendor responses](#binary-and-vendor-responses).

XML, YAML, and CSV responses are typed `string`, even with an object schema. A media type you register changes the value but not the type, so cast `data`:

```typescript
const result = await getPetById({ path: { petId: 1 }, contentType: { response: 'application/xml' } })
if (result.contentType === 'application/xml') {
  const pet = result.data as unknown as Pet
}
```

> [!NOTE]
> With the adapter's default [`integerType: 'bigint'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype), an `int64` field is typed `bigint`, but `JSON.parse` returns a `number`. Set `integerType: 'number'`, or turn on [`validator: 'zod'`](https://kubb.dev/extensions/kubb-labs/plugin-ky/options#validator), which converts the field. `JSON.parse` loses precision above `Number.MAX_SAFE_INTEGER` either way, so declare an exact 64-bit ID as a string.

Next, [Server-sent events](https://kubb.dev/extensions/kubb-labs/plugin-ky/guides/server-sent-events) covers the stream media types and `client.stream`.

## Less common cases

### Delimited styles and allowReserved

When a [query parameter](#parameter-styles) uses `spaceDelimited` or `pipeDelimited`, or sets `allowReserved`:

- `spaceDelimited` and `pipeDelimited` default `explode` to `false`. With `explode: true`, they repeat the key, like `form`.
- With `allowReserved`, reserved characters stay as they are, except `#`, `&`, and `+`.

### Serializer files

When you look for a serializer in `.kubb/serializers/`, Kubb writes only the ones the spec needs and registers them in `.kubb/config.ts`. Set a key from the table to replace one, as [Override parameter serialization](#override-parameter-serialization) shows.

| Key in `serializer` | File                                                           | Written for                    |
| ------------------- | -------------------------------------------------------------- | ------------------------------ |
| `query`             | `query.ts`, or `queryStyles.ts` with a styled query parameter  | every spec                     |
| `path`              | `path.ts`, plus `pathStyles.ts` with a `label` or `matrix` one | every spec                     |
| `header`            | `headers.ts`                                                   | a spec with a header parameter |
| `cookie`            | `cookies.ts`                                                   | a spec with a cookie parameter |

A call that needs a serializer the spec did not register throws a `TypeError` that names it, such as `serializer.cookie`. Without `serializer.header`, an array or object header value goes out as JSON.

### Form and stream media types

When a form or stream type from [Built-in media types](#built-in-media-types) has no handler, the spec does not use it:

- `.kubb/config.ts` registers each form type only when the spec has a body of that type, from `.kubb/mediaTypes/formData.ts` and `.kubb/mediaTypes/urlencoded.ts`.
- It registers the stream types, `streamMediaTypes` from `.kubb/sse.ts`, only when the spec streams.
- `.kubb/client.ts` passes that config to `setConfig`.

To send a type the spec does not declare, register a handler, as [Add a media type](#add-a-media-type) shows.

### Default content types

When a call sets no `contentType`:

- An operation with one request content type has it built in. For one with several, set `contentType` on the call.
- A 2xx response without a `Content-Type` decodes as the call's `contentType.response`, then as `*/*`.

### `bigint` request bodies

When a request body holds a `bigint`, it goes out as a JSON number. A value outside the safe-integer range throws a `TypeError` instead of losing precision, so register a media type to send it another way.

### Media type merge order

When you register a handler for a type that already has one, handlers merge per key over the built-ins and over earlier `setConfig` calls. A handler passed on one call merges over the client's. An entry with only `decode` still encodes through the next match, such as `*/*`.

### Binary and vendor responses

When an operation's success content is only binary, Kubb sets `parseAs: 'blob'` on it, so `data` is a `Blob` whatever its media type. The generated types follow what the built-in media types return. A vendor type such as `application/vnd.github.object` keeps its schema type.

### Parameter validation

When [`validator`](https://kubb.dev/extensions/kubb-labs/plugin-ky/options#validator) checks `params`, the call sends what each `<operation>PathSchema`, `QuerySchema`, `HeadersSchema`, or `CookiesSchema` returns:

- A codec param such as a `Date` goes out in its wire form.
- Path and query keys the spec does not declare are stripped, such as a cache-buster.
- Undeclared headers pass through, and declared ones match in any casing. Client-level `headers` are checked too, and `auth` values are not.

With codecs, pair `request` and `params` with [`pluginZod({ inferred: 'codec' })`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#inferred), so the request types accept domain values such as a `Date`. To skip the checks, [turn validation off at runtime](https://kubb.dev/extensions/kubb-labs/plugin-ky/guides/error-handling#turn-validation-off-at-runtime).

### Error body validation

When `validator` is on and a non-2xx response has a body, the runtime checks it against the schema of its status, then its range such as `5xx`, then `default`. A status the document leaves out keeps its body unchecked. An error body that fails its schema throws a `ValidationError` instead of the `ResponseError`, also with `throwOnError: false`. The `ValidationError` keeps the response `status`. To recover, see [Validation failures](https://kubb.dev/extensions/kubb-labs/plugin-ky/guides/error-handling#validation-failures).
