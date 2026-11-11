---
'@kubb/plugin-client': major
'@kubb/plugin-fetch': major
'@kubb/plugin-axios': major
---

Run the fetch and axios clients on one core with the same interceptors and client factory.

- Import types from `templates/client.ts` and the runtime from `@kubb/plugin-client/templates/*`. `templates/fetch.ts` and `templates/axios.ts` are gone.
- `FetchOptions` and `AxiosOptions` are now `NativeOptions`.
- Rename `codecs` to `mediaTypes`, `serialize` to `encode`, and `deserialize` to `decode`, and move a custom `serializer.body` into a `mediaTypes` entry.
- Replace `responseType` with `parseAs`, and catch the `ParseError` that invalid JSON now throws.
- Replace `toEventStream(call, { shape })` with `client.stream({ ...config, eventShape })`, and name its result `StreamResult` with the event type, such as `StreamResult<Responses, true, ServerSentEvent<Pet>>`. `EventStreamResult` is gone.
- Return a web `Response` from a custom transport, built with `toRequestInit(request)`.
- Narrow `client.interceptors.error` handlers with `ResponseError.is`, since they now also get network and validation errors.
- On axios, `client.interceptors` handlers get the core objects. Put native handlers on `getAxiosInstance().interceptors`. `validateStatus`, `AxiosTransport`, `InterceptorFn`, and `InterceptorChannel` are gone.
- Make a custom client (`importPath`) generic and add a `stream` method.
- With `sdk` tag classes, rename `new pet(config)` to `new PetClient(config)`.
- Use the `servers` entry on a path or operation as that operation's default `baseURL`. A `baseURL` on the call still wins.

```diff
- import { client, defaultTransport } from './gen/.kubb/client'
+ import { client, createAxiosTransport, getAxiosInstance } from './gen/.kubb/client'

- defaultTransport.defaults.timeout = 10_000
- client.setConfig({ transport: axios.create({ baseURL }) })
+ getAxiosInstance().defaults.timeout = 10_000
+ client.setConfig({ transport: createAxiosTransport(axios.create({ baseURL })) })
```

To upgrade, regenerate, run `tsc --noEmit`, and follow your plugin's "Migrate to v6" guide. The query plugins work with v5 and v6.
