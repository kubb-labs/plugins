# Migrate to v6

In v6 the axios client runs on the same core as `@kubb/plugin-fetch`. Most edits land in the file that configures `client`. Find your code in the table, then follow its section.

## What to change

| Your code                                                                                                            | What to do                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calls generated functions, SDK methods, or hooks                                                                     | Regenerate. Nothing else.                                                                                                                                                                                     |
| Registers handlers on `client.interceptors`                                                                          | Move them to `axiosInstance.interceptors`, or rewrite them for the core objects. See [Keep your axios interceptors as they are](#keep-your-axios-interceptors-as-they-are) and [Interceptors](#interceptors). |
| Passes an axios instance as `transport`, or sets `defaultTransport.defaults`                                         | Wrap it with `createAxiosTransport(instance)`, and set defaults on `axiosInstance`. See [Transport and default instance](#transport-and-default-instance).                                                    |
| Uses `AxiosOptions`, `validateStatus`, `AxiosTransport`, `InterceptorFn`, or `InterceptorChannel`                    | Rename `AxiosOptions` to `NativeOptions`, and drop the rest. See [Removed exports](#removed-exports).                                                                                                         |
| Imports from `templates/axios.ts`, `templates/core.ts`, `templates/serializers.ts`, or `templates/standardSchema.ts` | Import from `templates/client.ts` or `@kubb/plugin-client/templates/*`. See [Template subpaths](#template-subpaths).                                                                                          |
| Names `EventStreamResult<Pet>`, `StreamResult`, or `UnwrappedStreamResult`                                           | Wrap the payload: `EventStreamResult<ServerSentEvent<Pet>>`. See [Stream result types](#stream-result-types).                                                                                                 |
| Relies on interceptor order, the error interceptor for network errors, or a separate instance per `createClient()`   | Check [Behavior changes](#behavior-changes). It compiles, so the type checker does not catch it.                                                                                                              |
| Comes from 5.12 or earlier and uses streams                                                                          | Check [From 5.12 or earlier](#from-5-12-or-earlier).                                                                                                                                                          |
| Uses SDK classes with `group: { type: 'tag' }`, such as `new pet(config)`                                            | Rename them to the PascalCase names, such as `new PetClient(config)`. See [SDK class names](#sdk-class-names).                                                                                                |

## Upgrade steps

1. Upgrade `kubb` and `@kubb/plugin-axios` together. v6 needs Kubb 5.16.0 or later:

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

The quickest fix moves each handler from `client.interceptors` to `axiosInstance.interceptors` and keeps its body. `axiosInstance` is the instance v5 called `defaultTransport`, so the handlers get the same axios objects in the same order:

```typescript
// before
import { client } from './gen/.kubb/client'

client.interceptors.request.use((config) => {
  config.headers.set('X-Request-ID', crypto.randomUUID())
  return config
})

// after
import { axiosInstance } from './gen/.kubb/client'

axiosInstance.interceptors.request.use((config) => {
  config.headers.set('X-Request-ID', crypto.randomUUID())
  return config
})
```

To share interceptor code with `@kubb/plugin-fetch` instead, rewrite the handlers for the core objects, as the next section shows.

## Interceptors

`client.interceptors` handlers receive the core's `ResolvedRequest`, `TransportResult`, and `ResponseError`, as on the fetch client:

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

For the native `InternalAxiosRequestConfig`, `AxiosResponse`, or `AxiosError`, register on `axiosInstance` instead. See [Add interceptors](https://kubb.dev/extensions/kubb-labs/plugin-axios/guides/interceptors).

`client.interceptors.error` runs for a `ResponseError` only, not for a network error. Catch network errors on the instance:

```typescript
import { axiosInstance } from './gen/.kubb/client'

axiosInstance.interceptors.response.use(undefined, (error) => {
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

Native axios interceptors for a custom transport go on the instance you pass to `createAxiosTransport`. `axiosInstance` only backs `defaultTransport`.

`defaultTransport` is now a function that sends through `axiosInstance`. Replace `defaultTransport.defaults` and `defaultTransport.interceptors` with `axiosInstance.defaults` and `axiosInstance.interceptors`.

## Removed exports

- `validateStatus` had no effect and is removed.
- Rename `AxiosOptions` to `NativeOptions`. Both are `AxiosRequestConfig`.
- `AxiosTransport`, `InterceptorFn`, and `InterceptorChannel` are removed. `createClientCore`, `ClientInstance`, and `Interceptors` come from the shared core, and `createClientCore({ defaultTransport })` takes a transport function.

## Template subpaths

`@kubb/plugin-axios/templates/axios.ts`, `templates/core.ts`, `templates/serializers.ts`, and `templates/standardSchema.ts` are gone. Import the client types from `@kubb/plugin-axios/templates/client.ts`, and the shared runtime from `@kubb/plugin-client/templates/*`. The package exports `templates/client.ts` for its types only. Runtime values such as `client` still come from the generated `.kubb/client.ts`.

## Stream result types

`EventStreamResult`, `StreamResult`, and `UnwrappedStreamResult` take the full event type, not the payload:

```typescript
// before
let result: EventStreamResult<PetEvent>

// after
let result: EventStreamResult<ServerSentEvent<PetEvent>>
```

## Behavior changes

These changes compile without errors, so check them by hand:

- `client.interceptors.request` handlers run in the order you register them. axios ran its request handlers in reverse.
- `client.interceptors.error` no longer runs for a network error. See [Interceptors](#interceptors).
- A child from `createClient()` inherits the `transport` of `client`. It used to get its own `axios.create()`.

## From 5.12 or earlier

These changed in 5.13 and compile without errors, so check them by hand:

- A stream call keeps the adapter set on the call or on the instance, such as a mock adapter in tests. Only a browser call with the default adapters switches to the fetch adapter.
- A successful stream call with a body that is not a stream, such as a JSON body, throws a `TypeError` with the body as its `cause`. A successful answer with no body still ends as an empty stream.
- An event the server ends without a blank line is dropped, as browser `EventSource` does, so end every event with one.

## SDK class names

With `sdk` and `group: { type: 'tag' }`, tag classes used the group folder name, such as `export class pet`. They now use `resolver.groupName`, such as `export class PetClient`, as without `group`. The files stay where they were, and the root class keeps its `pet` and `store` fields.

```diff
- import { pet } from './gen/sdk/pet/pet'
- const api = new pet({ baseURL })
+ import { PetClient } from './gen/sdk/pet/pet'
+ const api = new PetClient({ baseURL })
```

The root class now creates one client and shares it with every tag, so it builds one client instead of one per tag. Reach it as `api.client` to add interceptors.

## Query plugins

`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-mcp` work with v5 and v6, so you can upgrade them separately.
