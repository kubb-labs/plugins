# Migrate to v6

The fetch client keeps its API in v6, so most projects only regenerate. Find your code in the table, then follow its section.

## What to change

| Your code                                                                                                            | What to do                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Calls generated functions, SDK methods, or hooks                                                                     | Regenerate. Nothing else.                                                                                            |
| Imports from `templates/fetch.ts`, `templates/core.ts`, `templates/serializers.ts`, or `templates/standardSchema.ts` | Import from `templates/client.ts` or `@kubb/plugin-client/templates/*`. See [Template subpaths](#template-subpaths). |
| Uses `FetchOptions`                                                                                                  | Rename it to `NativeOptions`. See [Removed exports](#removed-exports).                                               |
| Names `EventStreamResult<Pet>`, `StreamResult`, or `UnwrappedStreamResult`                                           | Wrap the payload: `EventStreamResult<ServerSentEvent<Pet>>`. See [Stream result types](#stream-result-types).        |
| Sets `codecs`, `serializer.body`, or `responseType`                                                                  | Use `mediaTypes` and `parseAs`. See [Media types](#media-types).                                                     |
| Calls `toEventStream`, or writes a transport that returns a parsed body                                              | Use `client.stream`, and return a web `Response`. See [Streams and transports](#streams-and-transports).             |
| Relies on invalid JSON becoming a string, or on the error interceptor skipping network errors                        | Check [Behavior changes in the runtime](#behavior-changes-in-the-runtime). It compiles.                              |
| Comes from 5.12 or earlier and uses streams                                                                          | Check [From 5.12 or earlier](#from-5-12-or-earlier). It compiles, so the type checker does not catch it.             |
| Uses SDK classes with `group: { type: 'tag' }`, such as `new pet(config)`                                            | Use the new names, such as `new PetClient(config)`. See [SDK class names](#sdk-class-names).                         |

## Upgrade steps

1. Upgrade `kubb` and `@kubb/plugin-fetch` together. v6 needs Kubb 5.16.0 or later:

   ```bash
   npm install --save-dev kubb@latest @kubb/plugin-fetch@6
   ```

2. Regenerate the client, which rewrites `.kubb/` and the operation files:

   ```bash
   npx kubb generate
   ```

3. Run the type checker. Each breaking change shows up as a compile error in your own code:

   ```bash
   npx tsc --noEmit
   ```

4. Fix each error with its row in [What to change](#what-to-change).

## Template subpaths

`@kubb/plugin-fetch/templates/fetch.ts`, `templates/core.ts`, `templates/serializers.ts`, and `templates/standardSchema.ts` are gone. Import the client types from `@kubb/plugin-fetch/templates/client.ts`, and the shared runtime from `@kubb/plugin-client/templates/*`:

```typescript
// before
import type { RequestConfig } from '@kubb/plugin-fetch/templates/fetch.ts'
import type { ResolvedRequest } from '@kubb/plugin-fetch/templates/core.ts'

// after
import type { RequestConfig } from '@kubb/plugin-fetch/templates/client.ts'
import type { ResolvedRequest } from '@kubb/plugin-client/templates/core.ts'
```

The package exports `templates/client.ts` for its types only. Runtime values such as `client` still come from the generated `.kubb/client.ts`.

## Removed exports

Rename `FetchOptions` to `NativeOptions`. It is the same type, `RequestInit` plus Next.js's `next`:

```typescript
// before
import type { FetchOptions } from './gen/.kubb/client'

// after
import type { NativeOptions } from './gen/.kubb/client'
```

## Stream result types

`EventStreamResult`, `StreamResult`, and `UnwrappedStreamResult` take the full event type, not the payload. Wrap a payload in `ServerSentEvent`:

```typescript
// before
let result: EventStreamResult<PetEvent>

// after
let result: EventStreamResult<ServerSentEvent<PetEvent>>
```

A stream typed with `TypedEvent<…>` stays the same.

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

A key can now be a pattern, such as `application/*+json` or `text/*`. See [Configure serialization](https://kubb.dev/extensions/kubb-labs/plugin-fetch/guides/serialization).

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

- Invalid JSON under a JSON media type throws a `ParseError` instead of becoming a string. Catch it, or register a lenient `application/json` handler.
- An empty body is `undefined` for every media type, text included.
- Error interceptors also get network errors, aborts, and validation errors, so narrow with `ResponseError.is` before reading `status`. Each handler gets the error the previous one returned.
- `ResponseError.data` holds the validated body.
- A `2XX` response key is a success, and range keys such as `4XX` type `status` as the numbers they cover.
- An auth requirement that needs several schemes sends all of them.

## From 5.12 or earlier

These changed in 5.13 and compile without errors, so check them by hand:

- A successful stream call with a body that is not a stream, such as a JSON body, throws a `TypeError` with the body as its `cause`. A successful answer with no body still ends as an empty stream.
- An event the server ends without a blank line is dropped, as browser `EventSource` does, so end every event with one.

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
