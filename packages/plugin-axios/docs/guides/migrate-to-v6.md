# Migrate to v6

In v6 the axios client runs on the same core as `@kubb/plugin-fetch`. Most edits land in the file that configures `client`. Find your code in the table, then follow its section.

## What to change

| Your code                                                                                                                          | What to do                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Calls generated functions, SDK methods, or hooks                                                                                   | Regenerate. Nothing else.                                                                                                                                                                                          |
| Registers handlers on `client.interceptors`                                                                                        | Move them to `getAxiosInstance().interceptors`, or rewrite them for the core objects. See [Keep your axios interceptors as they are](#keep-your-axios-interceptors-as-they-are) and [Interceptors](#interceptors). |
| Passes an axios instance as `transport`, or sets `defaultTransport.defaults`                                                       | Wrap it with `createAxiosTransport(instance)`, and set defaults on `getAxiosInstance()`. See [Transport and default instance](#transport-and-default-instance).                                                    |
| Uses `AxiosOptions`, `validateStatus`, `AxiosTransport`, `InterceptorFn`, or `InterceptorChannel`                                  | Rename `AxiosOptions` to `NativeOptions`, and drop the rest. See [Removed exports](#removed-exports).                                                                                                              |
| Imports from `templates/axios.ts`, `templates/core.ts`, `templates/serializers.ts`, or `templates/standardSchema.ts`               | Import from `templates/client.ts` or `@kubb/plugin-client/templates/*`. See [Template subpaths](#template-subpaths).                                                                                               |
| Names `EventStreamResult<Pet>`, `StreamResult`, or `UnwrappedStreamResult`                                                         | Use `StreamResult` and wrap the payload in `ServerSentEvent`. See [Stream result types](#stream-result-types).                                                                                                     |
| Relies on interceptor order, or a separate instance per `createClient()`                                                           | Check [Behavior changes](#behavior-changes). It compiles, so the type checker does not catch it.                                                                                                                   |
| Sets `codecs`, `serializer.body`, or `responseType`                                                                                | Use `mediaTypes` and `parseAs`. See [Media types](#media-types).                                                                                                                                                   |
| Calls `toEventStream`, or writes a transport that returns a parsed body                                                            | Use `client.stream`, and return a web `Response`. See [Streams and transports](#streams-and-transports).                                                                                                           |
| Relies on invalid JSON becoming a string, or on the error interceptor skipping network errors                                      | Check [Behavior changes in the runtime](#behavior-changes-in-the-runtime). It compiles.                                                                                                                            |
| Comes from 5.12 or earlier and uses streams                                                                                        | Check [From 5.12 or earlier](#from-5-12-or-earlier).                                                                                                                                                               |
| Imports `defaultQuerySerializer`, `defaultPathSerializer`, `applyHeaderStyles`, or `serializeCookies`                              | Import the renamed function from `.kubb/serializers/`. See [Serializers](#serializers).                                                                                                                            |
| Imports a `…Status2XX` type, or writes a `'2XX'` key                                                                               | Write the range in lower case. See [Status ranges](#status-ranges).                                                                                                                                                |
| Has `servers` on a path or operation, sends object query parameters or array headers without a `style`, or reads XML, YAML, or CSV | Check [Behavior changes in the runtime](#behavior-changes-in-the-runtime).                                                                                                                                         |
| Groups by tag in an OpenAPI 3.2 document whose tags set `parent`                                                                   | Update the import paths. See [Tag folders](#tag-folders).                                                                                                                                                          |
| Uses SDK classes with `group: { type: 'tag' }`, such as `new pet(config)`                                                          | Use the new names, such as `new PetClient(config)`. See [SDK class names](#sdk-class-names).                                                                                                                       |

## Upgrade steps

1. Upgrade `kubb` and `@kubb/plugin-axios` together. v6 needs Kubb 5.18.4 or later:

   ```bash
   npm install --save-dev kubb@latest @kubb/plugin-axios@6
   ```

2. Regenerate the client, which rewrites `.kubb/` and the operation files:

   ```bash
   npx kubb generate
   ```

3. Run the type checker. Each breaking change shows up as a compile error in your own code:

   ```bash
   npx tsc --noEmit
   ```

4. Fix each error with its row in [What to change](#what-to-change), then check the rows that compile.

## Keep your axios interceptors as they are

The quickest fix moves each handler from `client.interceptors` to `getAxiosInstance().interceptors` and keeps its body. `getAxiosInstance()` is the instance v5 called `defaultTransport`, so the handlers get the same axios objects in the same order:

```typescript
// before
import { client } from './gen/.kubb/client'

client.interceptors.request.use((config) => {
  config.headers.set('X-Request-ID', crypto.randomUUID())
  return config
})

// after
import { getAxiosInstance } from './gen/.kubb/client'

getAxiosInstance().interceptors.request.use((config) => {
  config.headers.set('X-Request-ID', crypto.randomUUID())
  return config
})
```

To share interceptor code with `@kubb/plugin-fetch` instead, rewrite the handlers for the core objects, as the next section shows.

## Interceptors

`client.interceptors` handlers receive the core's `ResolvedRequest`, `DecodedResponse`, and the error a call ends with, as on the fetch client:

```typescript
// before: native axios objects
client.interceptors.request.use((config) => {
  config.headers.set('X-Request-ID', crypto.randomUUID())
  return config
})

// after: the resolved request
client.interceptors.request.use((request) => {
  request.headers['X-Request-ID'] = crypto.randomUUID()
  return request
})
```

For the native `InternalAxiosRequestConfig`, `AxiosResponse`, or `AxiosError`, register on `getAxiosInstance()` instead. See [Add interceptors](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/interceptors).

`client.interceptors.error` now runs for every failure and gets a network error as the native `AxiosError`. You can also catch it on the instance:

```typescript
import { getAxiosInstance } from './gen/.kubb/client'

getAxiosInstance().interceptors.response.use(undefined, (error) => {
  reportNetworkError(error)
  return Promise.reject(error)
})
```

## Transport and default instance

`transport` takes a transport function. Wrap an axios instance with `createAxiosTransport`:

```typescript
// before
client.setConfig({ transport: axios.create({ timeout: 10_000 }) })

// after
client.setConfig({ transport: createAxiosTransport(axios.create({ timeout: 10_000 })) })
```

Native axios interceptors for a custom transport go on the instance you pass to `createAxiosTransport`. `getAxiosInstance()` only backs `defaultTransport`.

`defaultTransport` is now a function that sends through `getAxiosInstance()`. Replace `defaultTransport.defaults` and `defaultTransport.interceptors` with `getAxiosInstance().defaults` and `getAxiosInstance().interceptors`.

## Removed exports

- `validateStatus` had no effect and is removed.
- Rename `AxiosOptions` to `NativeOptions`. Both are `AxiosRequestConfig`.
- `AxiosTransport`, `InterceptorFn`, and `InterceptorChannel` are removed. `createClientCore`, `ClientInstance`, and `Interceptors` come from the shared core, and `createClientCore({ defaultTransport })` takes a transport function.

## Template subpaths

`@kubb/plugin-axios/templates/axios.ts`, `templates/core.ts`, `templates/serializers.ts`, and `templates/standardSchema.ts` are gone. Import the client types from `@kubb/plugin-axios/templates/client.ts`, and the shared runtime from `@kubb/plugin-client/templates/*`. The package exports `templates/client.ts` for its types only. Runtime values such as `client` still come from the generated `.kubb/client.ts`.

## Stream result types

`EventStreamResult` is gone, since no call returns it. Name a stream call's result `StreamResult`. `StreamResult` and `UnwrappedStreamResult` take the full event type, not the payload. Wrap a payload in `ServerSentEvent`:

```typescript
// before
let result: EventStreamResult<PetEvent>

// after
let result: StreamResult<StreamPetsResponses, true, ServerSentEvent<PetEvent>>
```

## Behavior changes

These changes compile without errors, so check them by hand:

- `client.interceptors.request` handlers run in the order you register them. axios ran its request handlers in reverse.
- A child from `createClient()` inherits the `transport` of `client`. It used to get its own `axios.create()`.

## Media types

`codecs` is now `mediaTypes`, and its methods are renamed:

| Before                                                          | After                                        | Migration                                                                      |
| --------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| `codecs`                                                        | `mediaTypes`                                 | Rename the key.                                                                |
| `codecs[type].serialize(body, contentType)`                     | `mediaTypes[type].encode(body, context)`     | Read `context.contentType`.                                                    |
| `codecs[type].deserialize(raw, contentType)` with a parsed body | `mediaTypes[type].decode(response, context)` | Read the body yourself: `await response.text()`.                               |
| `serializer.body`                                               | removed                                      | Move a custom body serializer into a `mediaTypes` entry.                       |
| `responseType` on a call, a string or a map                     | removed                                      | Use `parseAs`, such as `parseAs: 'blob'`, or a media type entry for that call. |

```typescript
// before
client.setConfig({ codecs: { 'application/xml': { deserialize: (raw) => parseXml(raw as string) } } })

// after
client.setConfig({ mediaTypes: { 'application/xml': { decode: async (response) => parseXml(await response.text()) } } })
```

A key can now be a pattern, such as `application/*+json` or `text/*`. See [Configure serialization](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/serialization).

## Streams and transports

`toEventStream` is gone. Send the request with `client.stream`, whose result is already the stream:

```typescript
// before
const { stream } = await toEventStream(client({ method: 'GET', url: '/events', responseType: 'stream' }), { shape: 'data' })

// after
const { stream } = await client.stream({ method: 'GET', url: '/events', eventShape: 'data' })
```

Import `ServerSentEvent`, `TypedEvent`, and `StreamResult` from `.kubb/client.ts`, not `.kubb/sse.ts`.

A transport returns a web `Response`, or `{ webResponse, request, response }` to set the native objects. `readResponse`, `resolveResponseType`, `parseJsonOrText`, `isStreamed`, `ResponseType`, `ResponseTypeMap`, `Codec`, `Deserializer`, `ContentBodySerializer`, `BodySerializer`, `defaultBodySerializer`, and `CallResult` are gone. Response interceptors receive a `DecodedResponse`, the shape `TransportResult` had.

```typescript
// before
transport: async () => ({ data: { id: 1 }, status: 200, statusText: 'OK', headers: new Headers(), request, response })

// after
transport: async () => Response.json({ id: 1 })
```

## Behavior changes in the runtime

These compile without errors, so check them by hand:

- Native axios response interceptors see the raw bytes, not the decoded body.
- Invalid JSON under a JSON media type throws a `ParseError` instead of becoming a string. Catch it, or register a lenient `application/json` handler.
- An empty body is `undefined` for every media type, text included.
- Error interceptors also get network errors, aborts, and validation errors, so narrow with `ResponseError.is` before reading `status`. Each handler gets the error the previous one returned.
- `ResponseError.data` holds the validated body.
- A `2xx` response key is a success, and range keys such as `4xx` type `status` as the numbers they cover.
- An auth requirement that needs several schemes sends all of them.
- A path or operation with its own `servers` sends its calls there instead of to the client's `baseURL`. Pass `baseURL` on the call to override it. See [Set the base URL](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/base-url).
- An object query parameter without a `style` goes out as `name=odie&age=3`, not `filter[name]=odie`. Set `style: deepObject` in the document to keep brackets.
- An array or object header without a `style` goes out as `X-Ids: 3,4`, not as JSON.
- A space in a query value is sent as `%20`, not `+`.
- An XML, YAML, or CSV response is typed `string`, and an image, audio, video, PDF, or `application/octet-stream` response is typed `Blob`.

## From 5.12 or earlier

These changed in 5.13 and compile without errors, so check them by hand:

- A stream call keeps the adapter set on the call or on the instance, such as a mock adapter in tests. Only a browser call with the default adapters switches to the fetch adapter.
- A successful stream call with a body that is not a stream, such as a JSON body, throws a `TypeError` with the body as its `cause`. A successful answer with no body still ends as an empty stream.
- An event the server ends without a blank line is dropped, as browser `EventSource` does, so end every event with one.

## Serializers

The serializers moved out of `.kubb/serializers.ts` into one file each, and Kubb writes a file only when the document needs it:

| Before                   | After                                                                                                         | File in `.kubb/serializers/`   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `defaultQuerySerializer` | `serializeQuery`, or `serializeStyledQuery` for a document with a styled query parameter or a urlencoded body | `query.ts` or `queryStyles.ts` |
| `defaultPathSerializer`  | `serializePath`, plus `serializeStyledPath` for a `label` or `matrix` parameter                               | `path.ts`, `pathStyles.ts`     |
| `applyHeaderStyles`      | `serializeHeaders`                                                                                            | `headers.ts`                   |
| `serializeCookies`       | `serializeCookies`, for a document with a cookie parameter                                                    | `cookies.ts`                   |

`.kubb/config.ts` registers the ones your document needs, and `setConfig({ serializer })` merges per key, so setting `serializer.query` keeps the others. A client you build with `createClientCore` gets none, so pass them in its `serializer` config.

## Status ranges

A status range is written in lower case in generated names and keys. Rename the imports, and the range keys in a responses record or `validator.error` map you wrote by hand:

```diff
- import type { ListPetsStatus4XX } from './gen/types/ListPets'
+ import type { ListPetsStatus4xx } from './gen/types/ListPets'
```

## Tag folders

With `group: { type: 'tag' }`, a tag whose OpenAPI 3.2 `parent` is `store` now writes to `store/payment/` instead of `payment/`. Pass `group.name` to keep one folder per tag:

```typescript
pluginAxios({ group: { type: 'tag', name: ({ group }) => group } })
```

## SDK class names

With `sdk` and `group: { type: 'tag' }`, tag classes are now named like `PetClient` instead of `pet`. The files and the root class's `pet` and `store` fields stay the same:

```diff
- import { pet } from './gen/sdk/pet/pet'
- const api = new pet({ baseURL })
+ import { PetClient } from './gen/sdk/pet/pet'
+ const api = new PetClient({ baseURL })
```

The root class shares one client with every tag. Add interceptors on `api.client`.

## Query plugins

`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-mcp` work with v5 and v6, so you can upgrade them separately.
