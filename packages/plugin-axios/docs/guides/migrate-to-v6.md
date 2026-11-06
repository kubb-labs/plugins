# Migrate to v6

`@kubb/plugin-axios` 6 runs on the same client core as `@kubb/plugin-fetch`. The axios client keeps its generated functions, and its runtime API moves to the shared core. Code that only calls the generated functions or hooks needs no change. Most of the work is in the file that configures `client`.

## Upgrade steps

1. Upgrade `kubb` and `@kubb/plugin-axios` together. v6 needs Kubb 5.16.0 or later:

   ```bash
   npm install --save-dev kubb@latest @kubb/plugin-axios@6
   ```

2. Regenerate the client. This rewrites `.kubb/` and the operation files, so generated code needs no hand edits:

   ```bash
   npx kubb generate
   ```

3. Run the type checker. Each breaking change shows up as a compile error in your own code:

   ```bash
   npx tsc --noEmit
   ```

4. Fix each error with the matching section below.
5. Check the changes that do not fail the type checker, listed under [Behavior changes](#behavior-changes), and, coming from 5.12 or earlier, [From 5.12 or earlier](#from-5-12-or-earlier).

## Keep your axios interceptors as they are

The shortest path moves each handler from `client.interceptors` to `axiosInstance.interceptors`. Their bodies stay the same, because `axiosInstance` takes the place `defaultTransport` had in v5, and its interceptors still receive axios objects in the same order:

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

`client.interceptors.error` runs for a `ResponseError` only. It used to run for a network error with no response. Catch those on the instance:

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

`defaultTransport` is now that function, and the instance it sends through is `axiosInstance`. Replace `defaultTransport.defaults` and `defaultTransport.interceptors` with `axiosInstance.defaults` and `axiosInstance.interceptors`. Clients from `createClient()` inherit the `transport` of `client`, and send through `axiosInstance` when neither sets one.

## Removed exports

- `validateStatus` had no effect and is removed. The client splits success from error by status.
- `AxiosTransport`, `InterceptorFn`, and `InterceptorChannel` are removed. `createClientCore`, `ClientInstance`, and `Interceptors` come from the shared core, and `createClientCore({ defaultTransport })` takes a transport function.

## Template subpaths

`@kubb/plugin-axios/templates/axios.ts`, `templates/core.ts`, `templates/serializers.ts`, and `templates/standardSchema.ts` are gone. Import the client types from `@kubb/plugin-axios/templates/client.ts`, and the shared runtime from `@kubb/plugin-client/templates/*`. Generated operations and imports from the generated `.kubb/client.ts` need no change, except imports of the removed exports listed above.

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

5.13 already changed these, and they compile without errors, so check them by hand:

- A stream call keeps the adapter set on the call or on the instance, such as a mock adapter in tests. Only a browser call with the default adapters switches to the fetch adapter.
- A successful stream call with a body that is not a stream, such as a JSON body, throws a `TypeError` with the body as its `cause`. A successful answer with no body still ends as an empty stream.
- An event the server ends without a blank line is dropped, as browser `EventSource` does, so end every event with one.

## Query plugins

`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-mcp` work with v5 and v6, so you can upgrade them separately.
