# Migrate to v6

Upgrade `@kubb/plugin-axios` from v5 to v6, which runs on the shared client core from `@kubb/plugin-client` with axios as the transport.

Code that only calls the generated functions, SDK classes, or hooks needs a regenerate. Most other edits land in the file that configures `client`.

## Upgrade steps

::steps{level="3"}

### Upgrade the packages

Upgrade `kubb` and `@kubb/plugin-axios` together. v6 needs Kubb 5.19.0 or later:

```bash
npm install --save-dev kubb@latest @kubb/plugin-axios@6
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

Find its row in [What to change](#what-to-change). Then check the [behavior changes](#behavior-changes), which the type checker does not catch.

::

## What to change

| You used                                                                         | Now                                                                                                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@kubb/plugin-axios/templates/axios.ts`                                          | `@kubb/plugin-axios/templates/client.ts`. It exports types only.                                                                                  |
| `@kubb/plugin-axios/templates/core.ts`, `serializers.ts`, or `standardSchema.ts` | `@kubb/plugin-client/templates/*`. These export types only.                                                                                       |
| `client.interceptors` handlers that read axios objects                           | Move them to `getAxiosInstance()`, or rewrite them. See [Interceptors](#interceptors).                                                            |
| An axios instance as `transport`                                                 | `createAxiosTransport(instance)`                                                                                                                  |
| `defaultTransport.defaults`                                                      | `getAxiosInstance().defaults`. `defaultTransport` is now a function.                                                                              |
| A `transport` that returns `{ data, status, ... }`                               | Return a web `Response`, or `{ webResponse, request, response }`. Response interceptors get a `DecodedResponse`, the shape `TransportResult` had. |
| `client.interceptors.error` handlers that read `status`                          | Narrow with `ResponseError.is` first. They also get network errors (`AxiosError`), aborts, and validation errors.                                 |
| `AxiosOptions`                                                                   | `NativeOptions`, the same type: `AxiosRequestConfig`.                                                                                             |
| `validateStatus`                                                                 | Removed. The client splits success from error by status.                                                                                          |
| `AxiosTransport`, `InterceptorChannel`                                           | Removed. `createClientCore`, `ClientInstance`, and `Interceptors` come from the core.                                                             |
| `InterceptorFn`                                                                  | The core's `InterceptorFn<T>`, which gets the core objects.                                                                                       |
| `defaultQuerySerializer`                                                         | `serializeQuery`, or `serializeStyledQuery` for a styled query parameter.                                                                         |
| `defaultPathSerializer`                                                          | `serializePath`, plus `serializeStyledPath` for a `label` or `matrix` parameter.                                                                  |
| `applyHeaderStyles`                                                              | `serializeHeaders`                                                                                                                                |
| `codecs`                                                                         | `mediaTypes`. See [Media types](#media-types).                                                                                                    |
| `Codec`, `Deserializer`, `ContentBodySerializer`, `BodySerializer`               | `MediaType`                                                                                                                                       |
| `serializer.body`, `defaultBodySerializer`, `isDefaultJsonBody`                  | A `mediaTypes` entry, or `defaultMediaTypes`.                                                                                                     |
| `responseType`, `ResponseType`, `ResponseTypeMap`, `resolveResponseType`         | `parseAs` and `ParseAs`, such as `parseAs: 'blob'`, or a media type.                                                                              |
| `formMediaTypes`                                                                 | `multipartFormData` and `urlencoded`, written to `.kubb/mediaTypes/` when the spec has a form body.                                               |
| `CallResult`, `isStreamed`, `getResponseContentType`                             | Removed. Read `result.contentType`.                                                                                                               |
| `toEventStream`, `EventStreamCall`, `EventStreamResult`                          | `client.stream` and `StreamResult`. See [Streams](#streams).                                                                                      |
| `ServerSentEvent`, `TypedEvent`, or `StreamResult` from `.kubb/sse.ts`           | Import them from `.kubb/client.ts`.                                                                                                               |
| A `…Status2XX` type, or a `'2XX'` key in a responses record or `validator.error` | Lower case: `…Status2xx` and `'2xx'`. An upper-case key is no longer read.                                                                        |
| `clients/payment/` for tag `payment` with `parent: store`                        | `clients/store/payment/`. To keep one folder per tag, pass `group: { type: 'tag', name: ({ group }) => group }`.                                  |
| `types/Point.ts` for operation `point` next to schema `Point`                    | `types/PointOperation.ts`, whenever a schema file has the same name, in any case.                                                                 |
| `new pet(config)` with `sdk` and `group: { type: 'tag' }`                        | `new PetClient(config)`. The files and the root class's fields, such as `pet`, stay the same.                                                     |
| `clientGenerator` from `@kubb/plugin-axios`                                      | Removed. Build on `setupClient` and `clientDependencies` from `@kubb/plugin-client`.                                                              |

Runtime values such as `client` still come from the generated `.kubb/client.ts`. The common rewrites:

::code-group

```diff [Imports]
- import type { RequestConfig } from '@kubb/plugin-axios/templates/axios.ts'
- import type { ResolvedRequest } from '@kubb/plugin-axios/templates/core.ts'
+ import type { RequestConfig } from '@kubb/plugin-axios/templates/client.ts'
+ import type { ResolvedRequest } from '@kubb/plugin-client/templates/core.ts'
```

```diff [Axios instance]
- import { client, defaultTransport } from './gen/.kubb/client'
+ import { client, createAxiosTransport, getAxiosInstance } from './gen/.kubb/client'

- defaultTransport.defaults.timeout = 10_000
- client.setConfig({ transport: axios.create({ baseURL }) })
+ getAxiosInstance().defaults.timeout = 10_000
+ client.setConfig({ transport: createAxiosTransport(axios.create({ baseURL })) })
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

## Interceptors

`client.interceptors` handlers now get the core objects: the `ResolvedRequest`, the `DecodedResponse`, and the error. The quickest fix moves each handler, unchanged, to `getAxiosInstance()`, the instance v5 called `defaultTransport`:

::code-group

```typescript [v5]
client.interceptors.request.use((config) => {
  config.headers.set('X-Request-ID', crypto.randomUUID())
  return config
})
```

```typescript [v6, native axios]
getAxiosInstance().interceptors.request.use((config) => {
  config.headers.set('X-Request-ID', crypto.randomUUID())
  return config
})
```

```typescript [v6, core objects]
client.interceptors.request.use((request) => {
  request.headers['X-Request-ID'] = crypto.randomUUID()
  return request
})
```

::

Native response interceptors see the raw bytes, not the decoded body. The core form also runs on `@kubb/plugin-fetch`.

## Media types

Rename `codecs` to `mediaTypes`. `serialize(body, contentType)` becomes `encode(body, context)`, with the type in `context.contentType`. `deserialize` got a parsed body, but `decode(response, context)` gets the `Response`, so read the body yourself:

```diff
- client.setConfig({ codecs: { 'application/xml': { deserialize: (raw) => parseXml(raw as string) } } })
+ client.setConfig({ mediaTypes: { 'application/xml': { decode: async (response) => parseXml(await response.text()) } } })
```

A key can be a pattern, such as `text/*`. See [Built-in media types](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/serialization#built-in-media-types).

## Streams

Send a stream request with `client.stream`. Its result is already the stream:

```diff
- const { stream } = await toEventStream(client({ method: 'GET', url: '/events', responseType: 'stream' }), { shape: 'data' })
+ const { stream } = await client.stream({ method: 'GET', url: '/events', eventShape: 'data' })
```

`StreamResult` and `UnwrappedStreamResult` take the responses record and the full event type, so wrap a payload in `ServerSentEvent`. A `TypedEvent<…>` stays the same:

```diff
- let result: EventStreamResult<PetEvent>
+ let result: StreamResult<StreamPetsResponses, true, ServerSentEvent<PetEvent>>
```

An operation whose only success type is JSON Lines now returns a `StreamResult` with one parsed item per line, not the body as a string. For stream responses that declare headers, see [Streaming](EDGE:streaming).

## Behavior changes

These compile without errors, so check them by hand:

| Area      | v5                                                                      | v6                                                                                                                                                                                  |
| --------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client    | `client.interceptors.request` handlers ran in reverse, as in axios.     | They run in the order you register them.                                                                                                                                            |
| Client    | A child from `createClient()` got its own `axios.create()`.             | It inherits the `transport` of `client`.                                                                                                                                            |
| Requests  | A path or operation with its own `servers` used the client's `baseURL`. | It calls its own server. A `baseURL` on the call still wins. See [Set the base URL](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/configure-requests#set-the-base-url). |
| Requests  | An object query parameter without `style`: `filter[name]=odie`.         | `name=odie&age=3`. Set `style: deepObject` in the spec to keep the brackets.                                                                                                        |
| Requests  | An array or object header without `style` went out as JSON.             | `X-Ids: 3,4`                                                                                                                                                                        |
| Requests  | A space in a query value: `+`.                                          | `%20`                                                                                                                                                                               |
| Requests  | `spaceDelimited` and `pipeDelimited` repeated the key.                  | `explode` defaults to `false`, so an array goes out as `ids=1%7C2`.                                                                                                                 |
| Requests  | A `style: cookie` parameter was percent-encoded.                        | Sent as is. A value it cannot send, such as one with `;`, throws a `TypeError`.                                                                                                     |
| Responses | Invalid JSON under a JSON media type became a string.                   | Throws a `ParseError`. Catch it, or register a lenient `application/json` entry.                                                                                                    |
| Responses | An aborted call or stream rejected with axios's `CanceledError`.        | It rejects with the signal's reason.                                                                                                                                                |

Also new in v6:

- Requests: `body: null` goes out as the JSON document `null`. A stream call sends `Accept: text/event-stream`, or its JSON Lines media type. An auth requirement that needs several schemes sends all of them.
- Responses: an empty body is `undefined` for every media type, text included. A failed call without a body reports `{ status, statusText }` as `error`. Every result, and a thrown `ResponseError`, has the response's `Headers` as `headers`.
- Validation: `ResponseError.data` holds the validated body.
- Types: a `2xx` key is a success, range keys such as `4xx` type `status` as the numbers they cover, and an exact code such as `200` wins over a range. XML, YAML, and CSV responses are `string`. Image, audio, video, PDF, and `application/octet-stream` responses are `Blob`, even with `type: string`. `result.contentType` is the bare media type, such as `'text/html'`.
- Serializers: each has its own file in `.kubb/serializers/`, and `setConfig({ serializer })` merges per key. A client you build with `createClientCore` gets no serializers, so pass them in its `serializer` config.
- Servers: `server.index` no longer counts a server without a `url`.

For new v6 features and upgrades from 5.12 or earlier, see [v6 upgrade notes](EDGE:v6-upgrade-notes).

## Query plugins

`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-mcp` work with v5 and v6, so you can upgrade them separately. They skip hooks for JSON Lines operations, as they do for event streams.
