# Migrate to v6

Upgrade `@kubb/plugin-axios` from v5 to v6, which runs on the shared client core from `@kubb/plugin-client` with axios as the transport. Code that only calls the generated functions, SDK classes, or hooks needs a regenerate. Most other edits land in the file that configures `client`.

## Upgrade steps

::steps{level="3"}

### Upgrade the packages

Upgrade `kubb` and `@kubb/plugin-axios` together. v6 needs Kubb 5.18.4 or later:

```bash
npm install --save-dev kubb@latest @kubb/plugin-axios@6
```

### Regenerate

This rewrites `.kubb/` and the operation files:

```bash
npx kubb generate
```

### Run the type checker

Most breaking changes show up as compile errors in your own code:

```bash
npx tsc --noEmit
```

### Fix each error

Find its row in [What to change](#what-to-change). Then read [Behavior changes](#behavior-changes), which the type checker does not catch.

::

## What to change

| Your code                                                                    | Change                                                                            |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Only calls generated functions, SDK methods, or hooks                        | Regenerate, then check the [behavior changes](#behavior-changes).                 |
| Registers handlers on `client.interceptors`                                  | [Move them to `getAxiosInstance()`, or rewrite them](#interceptors).              |
| Passes an axios instance as `transport`, or sets `defaultTransport.defaults` | [Use `createAxiosTransport` and `getAxiosInstance()`](#axios-instance).           |
| Imports from `templates/axios.ts` or `templates/core.ts`                     | [Change the import path](#template-imports).                                      |
| Uses `AxiosOptions`, `defaultQuerySerializer`, or another removed export     | [Use the replacement](#renamed-and-removed-exports).                              |
| Sets `codecs`, `serializer.body`, or `responseType`                          | [Use `mediaTypes` and `parseAs`](#media-types).                                   |
| Streams with `toEventStream`, or names `EventStreamResult`                   | [Use `client.stream` and `StreamResult`](#streams).                               |
| Writes a `transport` function                                                | [Return a web `Response`](#transports).                                           |
| Registers `client.interceptors.error` handlers                               | [Narrow the error first](#error-interceptors).                                    |
| Imports a `…Status2XX` type, or writes a `'2XX'` key                         | [Write the range in lower case](#status-ranges).                                  |
| Imports generated files by path                                              | [Update paths for nested tags and the `Operation` suffix](#generated-file-paths). |
| Uses SDK tag classes, such as `new pet(config)`                              | [Use `new PetClient(config)`](#sdk-class-names).                                  |
| Comes from 5.12 or earlier and streams                                       | [Check the 5.13 changes](#from-512-or-earlier).                                   |

## Template imports

`templates/axios.ts` is gone, and the package no longer publishes its own `templates/core.ts`, `templates/serializers.ts`, or `templates/standardSchema.ts`. Import the client types from `@kubb/plugin-axios/templates/client.ts` and the shared runtime from `@kubb/plugin-client/templates/*`:

```diff
- import type { RequestConfig } from '@kubb/plugin-axios/templates/axios.ts'
- import type { ResolvedRequest } from '@kubb/plugin-axios/templates/core.ts'
+ import type { RequestConfig } from '@kubb/plugin-axios/templates/client.ts'
+ import type { ResolvedRequest } from '@kubb/plugin-client/templates/core.ts'
```

These paths export types only. Runtime values such as `client` still come from the generated `.kubb/client.ts`.

## Renamed and removed exports

| v5                                                                 | v6                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `AxiosOptions`                                                     | `NativeOptions`, the same type: `AxiosRequestConfig`.                                 |
| `validateStatus`                                                   | Removed. The client splits success from error by status.                              |
| `AxiosTransport`, `InterceptorChannel`                             | Removed. `createClientCore`, `ClientInstance`, and `Interceptors` come from the core. |
| `InterceptorFn`                                                    | The core's `InterceptorFn<T>`, which gets the core objects.                           |
| `defaultQuerySerializer`                                           | `serializeQuery`, or `serializeStyledQuery` for a styled query parameter.             |
| `defaultPathSerializer`                                            | `serializePath`, plus `serializeStyledPath` for a `label` or `matrix` parameter.      |
| `applyHeaderStyles`                                                | `serializeHeaders`                                                                    |
| `toEventStream`, `EventStreamCall`, `EventStreamResult`            | `client.stream` and `StreamResult`. See [Streams](#streams).                          |
| `Codec`, `Deserializer`, `ContentBodySerializer`, `BodySerializer` | `MediaType`. See [Media types](#media-types).                                         |
| `defaultBodySerializer`, `isDefaultJsonBody`                       | A `mediaTypes` entry, or `defaultMediaTypes`.                                         |
| `ResponseType`, `ResponseTypeMap`, `resolveResponseType`           | `ParseAs` and `parseAs`.                                                              |
| `CallResult`, `isStreamed`, `getResponseContentType`               | Removed. Read `result.contentType`.                                                   |
| `clientGenerator` from `@kubb/plugin-axios`                        | Removed. Build on `setupClient` and `clientDependencies` from `@kubb/plugin-client`.  |

Each serializer now has its own file in `.kubb/serializers/`, written only when the spec needs it, and `setConfig({ serializer })` merges per key. `serializer.header` and `serializer.cookie` are new. A client you build with `createClientCore` gets no serializers, so pass them in its `serializer` config. See [Override parameter serialization](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/serialization#override-parameter-serialization).

`ServerSentEvent`, `TypedEvent`, and `StreamResult` moved from `.kubb/sse.ts` to `.kubb/client.ts`.

## Media types

| v5                                                              | v6                                           | Migration                                                  |
| --------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| `codecs`                                                        | `mediaTypes`                                 | Rename the key.                                            |
| `codecs[type].serialize(body, contentType)`                     | `mediaTypes[type].encode(body, context)`     | Read `context.contentType`.                                |
| `codecs[type].deserialize(raw, contentType)` with a parsed body | `mediaTypes[type].decode(response, context)` | Read the body yourself, such as `await response.text()`.   |
| `serializer.body`                                               | Removed                                      | Move a custom body serializer into a `mediaTypes` entry.   |
| `responseType` on a call, a string or a map                     | Removed                                      | Use `parseAs`, such as `parseAs: 'blob'`, or a media type. |

```diff
- client.setConfig({ codecs: { 'application/xml': { deserialize: (raw) => parseXml(raw as string) } } })
+ client.setConfig({ mediaTypes: { 'application/xml': { decode: async (response) => parseXml(await response.text()) } } })
```

A key can be a pattern, such as `text/*`. `formMediaTypes` is gone: `multipartFormData` and `urlencoded` are written to `.kubb/mediaTypes/` when the spec has a form body. See [Built-in media types](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/serialization#built-in-media-types).

## Streams

Send a stream request with `client.stream`. Its result is already the stream:

```diff
- const { stream } = await toEventStream(client({ method: 'GET', url: '/events', responseType: 'stream' }), { shape: 'data' })
+ const { stream } = await client.stream({ method: 'GET', url: '/events', eventShape: 'data' })
```

`StreamResult` and `UnwrappedStreamResult` take the responses record and the full event type. Wrap a payload in `ServerSentEvent`. A stream typed with `TypedEvent<…>` stays the same:

```diff
- let result: EventStreamResult<PetEvent>
+ let result: StreamResult<StreamPetsResponses, true, ServerSentEvent<PetEvent>>
```

| Change                                             | v5                         | v6                                                                                         |
| -------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| An operation whose only success type is JSON Lines | The whole body as a string | A `StreamResult` with one parsed item per line                                             |
| A stream response that declares headers            | `StreamResult`             | `StreamResultWithHeaders`, or `UnwrappedStreamResultWithHeaders` with `returnType: 'data'` |

See [Server-sent events](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/server-sent-events).

## Interceptors

`client.interceptors` handlers now get the core objects: the `ResolvedRequest`, the `DecodedResponse`, and the error. The quickest fix moves each handler to `getAxiosInstance()`, the instance v5 called `defaultTransport`, and keeps its body:

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

Native response interceptors see the raw bytes, not the decoded body. The core form also runs on `@kubb/plugin-fetch`. See [Add interceptors](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/configure-requests#add-interceptors).

## Axios instance

`transport` takes a transport function. Wrap an axios instance with `createAxiosTransport`, and set defaults on `getAxiosInstance()`:

```diff
- import { client, defaultTransport } from './gen/.kubb/client'
+ import { client, createAxiosTransport, getAxiosInstance } from './gen/.kubb/client'

- defaultTransport.defaults.timeout = 10_000
- client.setConfig({ transport: axios.create({ baseURL }) })
+ getAxiosInstance().defaults.timeout = 10_000
+ client.setConfig({ transport: createAxiosTransport(axios.create({ baseURL })) })
```

`defaultTransport` is now a function that sends through `getAxiosInstance()`.

## Transports

A transport function returns a web `Response`, or `{ webResponse, request, response }` to also set the native objects. The core decodes the body, and response interceptors get a `DecodedResponse`, the shape `TransportResult` had:

```diff
- transport: async () => ({ data: { id: 1 }, status: 200, statusText: 'OK', headers: new Headers(), request, response })
+ transport: async () => Response.json({ id: 1 })
```

See [Use a custom transport](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/transport).

## Error interceptors

`client.interceptors.error` handlers now also get network errors, aborts, and validation errors. A network error arrives as the native `AxiosError`. Narrow with `ResponseError.is` before you read `status`:

```typescript
client.interceptors.error.use((error) => {
  if (ResponseError.is(error) && error.status === 401) refreshToken()
  return error
})
```

See [Handle errors](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/error-handling).

## Status ranges

Status ranges are lower case in generated names and keys. Rename the imports, and the range keys in a hand-written responses record or `validator.error` map. An upper-case key such as `'2XX'` is no longer read:

```diff
- import type { ListPetsStatus4XX } from './gen/types/ListPets'
+ import type { ListPetsStatus4xx } from './gen/types/ListPets'
```

## Generated file paths

Two changes move generated files. The exported names stay the same:

| When                                                           | v5                 | v6                        |
| -------------------------------------------------------------- | ------------------ | ------------------------- |
| `group: { type: 'tag' }` and tag `payment` has `parent: store` | `clients/payment/` | `clients/store/payment/`  |
| Operation `point` next to schema `Point`                       | `types/Point.ts`   | `types/PointOperation.ts` |

To keep one folder per tag, pass `group.name`: `pluginAxios({ group: { type: 'tag', name: ({ group }) => group } })`. The `Operation` suffix applies when a schema file has the same name, in any case.

## SDK class names

With `sdk` and `group: { type: 'tag' }`, tag classes are named like `PetClient` instead of `pet`. The files and the root class's fields, such as `pet`, stay the same:

```diff
- import { pet } from './gen/sdk/pet/pet'
- const api = new pet({ baseURL })
+ import { PetClient } from './gen/sdk/pet/pet'
+ const api = new PetClient({ baseURL })
```

The root class shares one client with every tag, so add interceptors on `api.client`.

## Behavior changes

These compile without errors, so check them by hand.

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
- Validation: `ResponseError.data` holds the validated body. `validator.error` takes a map by status, such as `{ 404: getPetStatus404Schema }`, to check an error body against the schema of its status.
- Types: a `2xx` key is a success, range keys such as `4xx` type `status` as the numbers they cover, and an exact code such as `200` wins over a range. XML, YAML, and CSV responses are `string`, so JSON and XML together give `data: Pet | string`. Image, audio, video, PDF, and `application/octet-stream` responses are `Blob`, even with `type: string`. `result.contentType` is the bare media type, such as `'text/html'`.
- Servers: `server.index` no longer counts a server without a `url`. Servers with a `name` are exported as `servers` from `.kubb/client.ts`.

## From 5.12 or earlier

These changed in 5.13 and compile without errors:

- A stream call keeps the adapter set on the call or on the instance, such as a mock adapter in tests. Only a browser call with the default adapters switches to the fetch adapter.
- A successful stream call with a body that is not a stream, such as a JSON body, throws a `TypeError` with the body as its `cause`. A successful answer with no body still ends as an empty stream.
- An event the server ends without a blank line is dropped, as browser `EventSource` does, so end every event with one.

## Query plugins

`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-mcp` work with v5 and v6, so you can upgrade them separately. They skip hooks for JSON Lines operations, as they do for event streams.
