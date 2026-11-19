# Migrate to v6

Upgrade `@kubb/plugin-fetch` from v5 to v6, which runs on the shared client core from `@kubb/plugin-client`, the same core as `@kubb/plugin-axios`.

Code that only calls the generated functions, SDK classes, or hooks needs a regenerate. Code that configures `client`, adds media types, streams, or writes a transport needs the edits below.

## Upgrade steps

::steps{level="3"}

### Upgrade the packages

Upgrade `kubb` and `@kubb/plugin-fetch` together. v6 needs Kubb 5.19.0 or later:

```bash
npm install --save-dev kubb@latest @kubb/plugin-fetch@6
```

### Regenerate

This rewrites `.kubb/` and the operation files:

```bash
npx kubb generate
```

### Run the type checker

Most breaking changes show up as compile errors:

```bash
npx tsc --noEmit
```

### Fix each error

Find its row in [What to change](#what-to-change). Then check the [behavior changes](#behavior-changes), which compile without errors.

::

## What to change

| You used                                                                         | Now                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@kubb/plugin-fetch/templates/fetch.ts`                                          | `@kubb/plugin-fetch/templates/client.ts`. Types only.                                                                                                                                                    |
| `@kubb/plugin-fetch/templates/core.ts`, `serializers.ts`, or `standardSchema.ts` | `@kubb/plugin-client/templates/*`. Types only.                                                                                                                                                           |
| A `transport` that returns `{ data, status, ... }`                               | Return a web `Response`, or `{ webResponse, request, response }`. Build the `RequestInit` with `toRequestInit(request)`. Response interceptors get a `DecodedResponse`, the shape `TransportResult` had. |
| `client.interceptors.error` handlers that read `status`                          | Narrow with `ResponseError.is` first. They also get network errors, aborts, and validation errors.                                                                                                       |
| `FetchOptions`                                                                   | `NativeOptions`, the same type: `RequestInit` plus Next.js's `next`.                                                                                                                                     |
| `defaultQuerySerializer`                                                         | `serializeQuery`, or `serializeStyledQuery` for a styled query parameter.                                                                                                                                |
| `defaultPathSerializer`                                                          | `serializePath`, plus `serializeStyledPath` for a `label` or `matrix` parameter.                                                                                                                         |
| `applyHeaderStyles`                                                              | `serializeHeaders`                                                                                                                                                                                       |
| `codecs`                                                                         | `mediaTypes`. See [Media types](#media-types).                                                                                                                                                           |
| `Codec`, `Deserializer`, `ContentBodySerializer`, `BodySerializer`               | `MediaType`                                                                                                                                                                                              |
| `serializer.body`, `defaultBodySerializer`, `isDefaultJsonBody`                  | A `mediaTypes` entry, or `defaultMediaTypes`.                                                                                                                                                            |
| `responseType`, `ResponseType`, `ResponseTypeMap`, `resolveResponseType`         | `parseAs` and `ParseAs`, such as `parseAs: 'blob'`, or a media type.                                                                                                                                     |
| `formMediaTypes`                                                                 | `multipartFormData` and `urlencoded`, written to `.kubb/mediaTypes/` when the spec has a form body.                                                                                                      |
| `CallResult`, `isStreamed`, `getResponseContentType`                             | Removed. Read `result.contentType`.                                                                                                                                                                      |
| `toEventStream`, `EventStreamCall`, `EventStreamResult`                          | `client.stream` and `StreamResult`. See [Streams](#streams).                                                                                                                                             |
| `ServerSentEvent`, `TypedEvent`, or `StreamResult` from `.kubb/sse.ts`           | Import them from `.kubb/client.ts`.                                                                                                                                                                      |
| A `…Status2XX` type, or a `'2XX'` key in a responses record or `validator.error` | Lower case: `…Status2xx` and `'2xx'`. Upper-case keys are ignored.                                                                                                                                       |
| `clients/payment/` for tag `payment` with `parent: store`                        | `clients/store/payment/`. To keep one folder per tag, pass `group: { type: 'tag', name: ({ group }) => group }`.                                                                                         |
| `types/Point.ts` for operation `point` next to schema `Point`                    | `types/PointOperation.ts`, whenever a schema file has the same name, in any case.                                                                                                                        |
| `new pet(config)` with `sdk` and `group: { type: 'tag' }`                        | `new PetClient(config)`. Files and root class fields, such as `pet`, stay the same.                                                                                                                      |
| `clientGenerator` from `@kubb/plugin-fetch`                                      | Removed. Build on `setupClient` and `clientDependencies` from `@kubb/plugin-client`.                                                                                                                     |

Runtime values such as `client` still come from the generated `.kubb/client.ts`. The common rewrites:

::code-group

```diff [Imports]
- import type { RequestConfig } from '@kubb/plugin-fetch/templates/fetch.ts'
- import type { ResolvedRequest } from '@kubb/plugin-fetch/templates/core.ts'
+ import type { RequestConfig } from '@kubb/plugin-fetch/templates/client.ts'
+ import type { ResolvedRequest } from '@kubb/plugin-client/templates/core.ts'
```

```diff [Transport]
- transport: async () => ({ data: { id: 1 }, status: 200, statusText: 'OK', headers: new Headers(), request, response })
+ transport: async () => Response.json({ id: 1 })
```

```typescript [Error interceptors]
client.interceptors.error.use((error) => {
  if (ResponseError.is(error) && error.status === 401) refreshToken()
  return error
})
```

```diff [Status ranges]
- import type { ListPetsStatus4XX } from './gen/types/ListPets'
+ import type { ListPetsStatus4xx } from './gen/types/ListPets'
```

```diff [SDK classes]
- import { pet } from './gen/sdk/pet/pet'
- const api = new pet({ baseURL })
+ import { PetClient } from './gen/sdk/pet/pet'
+ const api = new PetClient({ baseURL })
```

::

## Media types

`serialize(body, contentType)` becomes `encode(body, context)`, with the type in `context.contentType`. `decode(response, context)` gets the `Response`, not a parsed body, so read the body yourself:

```diff
- client.setConfig({ codecs: { 'application/xml': { deserialize: (raw) => parseXml(raw as string) } } })
+ client.setConfig({ mediaTypes: { 'application/xml': { decode: async (response) => parseXml(await response.text()) } } })
```

A key can be a pattern, such as `text/*`. See [Built-in media types](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/serialization#built-in-media-types).

## Streams

`client.stream` returns the stream directly:

```diff
- const { stream } = await toEventStream(client({ method: 'GET', url: '/events', responseType: 'stream' }), { shape: 'data' })
+ const { stream } = await client.stream({ method: 'GET', url: '/events', eventShape: 'data' })
```

`StreamResult` and `UnwrappedStreamResult` take the responses record and the full event type, so wrap a payload in `ServerSentEvent`. A `TypedEvent<…>` stays as is:

```diff
- let result: EventStreamResult<PetEvent>
+ let result: StreamResult<StreamPetsResponses, true, ServerSentEvent<PetEvent>>
```

An operation whose only success type is JSON Lines returns a `StreamResult` with one parsed item per line, not a string. For stream responses with headers, see [Stream result types](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/server-sent-events#stream-result-types).

## Behavior changes

These compile without errors, so check them by hand:

| Area      | v5                                                                      | v6                                                                                                                                                                              |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requests  | A path or operation with its own `servers` used the client's `baseURL`. | It calls its own server, unless the call sets `baseURL`. See [Set the base URL](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/configure-requests#set-the-base-url). |
| Requests  | An object query parameter without `style`: `filter[name]=odie`.         | `name=odie&age=3`. Set `style: deepObject` in the spec to keep the brackets.                                                                                                    |
| Requests  | An array or object header without `style` went out as JSON.             | `X-Ids: 3,4`                                                                                                                                                                    |
| Requests  | A space in a query value: `+`.                                          | `%20`                                                                                                                                                                           |
| Requests  | `spaceDelimited` and `pipeDelimited` repeated the key.                  | `explode` defaults to `false`, so an array goes out as `ids=1%7C2`.                                                                                                             |
| Requests  | A `style: cookie` parameter was percent-encoded.                        | Sent as is. A value it cannot send, such as one with `;`, throws a `TypeError`.                                                                                                 |
| Responses | Invalid JSON under a JSON media type became a string.                   | Throws a `ValidationError`. Catch it, or register a lenient `application/json` entry.                                                                                           |

Also new in v6:

- Requests: `body: null` is sent as JSON `null`. A stream call sends `Accept: text/event-stream`, or its JSON Lines media type. An auth requirement with several schemes sends all of them.
- Responses: an empty body is `undefined` for every media type, text included. A failed call without a body has `{ status, statusText }` as `error`. Every result and thrown `ResponseError` has the response `Headers` as `headers`. An aborted call or stream rejects with the signal's reason.
- Validation: `ResponseError.data` holds the validated body.
- Types: a `2xx` key is a success, a range key such as `4xx` types `status` as the codes it covers, and an exact code such as `200` wins over a range. XML, YAML, and CSV responses are `string`, so JSON and XML together give `data: Pet | string`. Image, audio, video, PDF, and `application/octet-stream` responses are `Blob`, even with `type: string`. `result.contentType` is the bare media type, such as `'text/html'`.
- Serializers: each has its own file in `.kubb/serializers/`, and `setConfig({ serializer })` merges per key. A `createClientCore` client gets no serializers, so pass them in its `serializer` config.
- Servers: `server.index` no longer counts a server without a `url`.

If you upgrade from 5.12 or earlier, also check [these changes](#from-512-or-earlier).

## Query plugins

`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-mcp` work with v5 and v6, so you can upgrade them separately. They skip hooks for JSON Lines and event stream operations.

## Less common cases

### New in v6

These v6 features need no code change:

- Validation: `validator.error` takes a map by status, such as `{ 404: getPetStatus404Schema }`, to check an error body against the schema of its status.
- Serializers: `serializer.header` and `serializer.cookie` are new. See [Override parameter serialization](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/serialization#override-parameter-serialization).
- Servers: named servers are exported as `servers` from `.kubb/client.ts`. See [Named servers](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/configure-requests#named-servers).

### From 5.12 or earlier

These changed in 5.13 and compile without errors:

- A successful stream call with a non-stream body, such as JSON, throws a `TypeError` with the body as its `cause`. A successful answer with no body still ends as an empty stream.
- An event that does not end with a blank line is dropped, as in browser `EventSource`, so end every event with one.

### SDK root class

With an SDK root class, add interceptors on `api.client`, because the root class shares one client with every tag. See [`sdk`](https://kubb.dev/extensions/kubb-labs/plugin-fetch/options#sdk).
