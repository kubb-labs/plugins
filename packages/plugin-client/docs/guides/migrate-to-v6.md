# Migrate to v6

Update your client module for `@kubb/plugin-client` 6, which calls your client with type arguments and streams through `client.stream`.

## What to change

| Your code                                                                       | What to do                                                                                                                                |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Exports a `client` that takes no type arguments                                 | Make it [generic](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/migrate-to-v6#a-generic-client-call).                        |
| Exports `toEventStream` or `EventStreamResult`                                  | Add a [stream method](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/migrate-to-v6#a-stream-method-instead-of-toeventstream). |
| Declares `responseType` on `RequestConfig`, or lacks `contentType` or `cookies` | Add the [new fields](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/migrate-to-v6#new-fields-on-the-request-config).          |
| Reads `security` entries as single schemes                                      | Handle [arrays and the new fields](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/migrate-to-v6#security-requirements).       |
| Imports a `…Status2XX` type, or writes a `'2XX'` key                            | Write [ranges in lower case](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/migrate-to-v6#status-ranges).                     |
| Groups by tag in an OpenAPI 3.2 document whose tags set `parent`                | Update the [import paths](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/migrate-to-v6#tag-folders).                          |
| Has `servers` on a path or operation, or reads XML, YAML, CSV, or binary bodies | It compiles. Check the [behavior changes](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/migrate-to-v6#behavior-changes).     |
| Wants `.unwrap()` or a call that resolves to the body                           | Optional. Set [`returnType`](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/migrate-to-v6#return-type).                       |

## Upgrade steps

1. Upgrade `kubb` and `@kubb/plugin-client` together. v6 needs Kubb 5.19.0 or later:

   ```bash
   npm install --save-dev kubb@latest @kubb/plugin-client@6
   ```

2. Update your client module with the sections below.
3. Regenerate with `npx kubb generate`.
4. Run `npx tsc --noEmit`. A missing export or field shows up as a compile error in the generated files.

## A generic client call

A generated function calls `client<TResponses, ThrowOnError>(config)`:

```typescript
export const client = <TResponses, ThrowOnError extends boolean = true>(config: RequestConfig) =>
  send(config) as Promise<RequestResult<TResponses, ThrowOnError>>
```

## A stream method instead of toEventStream

A Server-Sent Events or JSON Lines operation calls `client.stream<TResponses, ThrowOnError, TItem>(config)`. Remove `toEventStream` and `EventStreamResult`, add `stream` to `client`, and export `StreamResult`, `SuccessOf`, `TypedEvent`, and `ServerSentEvent`:

```typescript
export type StreamResult<TResponses, ThrowOnError extends boolean = true, TEvent = ServerSentEvent<SuccessOf<TResponses>>> = {
  stream: AsyncGenerator<TEvent>
  response: Response
}

export function client<TResponses, ThrowOnError extends boolean = true>(config: RequestConfig) {
  return send<TResponses, ThrowOnError>(config)
}

client.stream = async <TResponses, ThrowOnError extends boolean = true, TEvent = ServerSentEvent<SuccessOf<TResponses>>>(
  config: RequestConfig,
): Promise<StreamResult<TResponses, ThrowOnError, TEvent>> => {
  // send the request and parse the body into TEvent values
}
```

See [Stream Server-Sent Events and JSON Lines](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/streaming) for every stream field and for JSON Lines.

## New fields on the request config

Add these fields to your `RequestConfig`, or the generated functions fail to compile:

```typescript
export type RequestConfig = {
  // ...
  contentType?: string | { request?: string; response?: string }
  // Replaces `responseType`. Binary downloads pass 'blob'.
  parseAs?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'
  // Server-Sent Events only.
  eventShape?: 'event' | 'data'
  rawData?: boolean | Array<string>
  // Name and value pairs for `in: cookie` parameters. Join them into a `Cookie` header on the server.
  cookies?: object
  // `style`, `explode`, `allowReserved`, and `contentType` per parameter, grouped by location.
  styles?: object
}
```

> [!NOTE]
> Browsers ignore a `Cookie` header set by script and send their own cookies. See [Cookie parameters with the cookie style](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client#cookie-parameters-with-the-cookie-style) for the OpenAPI 3.2 `cookie` style.

## Security requirements

An entry is an array when one requirement needs several schemes together, such as an API key and a session cookie. Send all of them, or skip the entry. `oauth2` now also passes `flows` and `metadataUrl`, and `openIdConnect` passes `url`:

```typescript
export type Auth = {
  type: string
  scheme?: string
  name?: string
  in?: string
  scopes?: Array<string>
  flows?: Record<string, Record<string, string>>
  metadataUrl?: string
  url?: string
}
```

## Status ranges

Generated names and keys write status ranges in lower case. Rename the imports and any range keys you wrote by hand in a responses record or `validator.error` map. An upper-case key such as `'2XX'` is no longer read:

```diff
- import type { ListPetsStatus4XX } from './gen/types/ListPets'
+ import type { ListPetsStatus4xx } from './gen/types/ListPets'
```

## Tag folders

With `group: { type: 'tag' }`, a tag whose OpenAPI 3.2 `parent` is `store` now writes to `store/payment/`, not `payment/`. One relative `importPath` cannot serve both folder depths. Pass `group.name` to keep one folder per tag, or set `importPath` to a package name or alias:

```typescript
pluginClient({ importPath: '../../../client', group: { type: 'tag', name: ({ group }) => group } })
```

## Behavior changes

These compile without errors, so check them by hand:

| Change                                                                                                                          | What your client must do                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| A path or operation with its own `servers` passes that server as `baseURL`.                                                     | Use `config.baseURL` when set.                                                                         |
| A `2xx` key is a success, and an exact code such as `200` wins over a range before it.                                          | Nothing, unless you read the responses record by hand.                                                 |
| XML, YAML, and CSV responses are typed `string`. Image, audio, video, PDF, and `application/octet-stream` responses are `Blob`. | Read a `Blob` when the call passes `parseAs: 'blob'`, which it does when every success type is binary. |
| An operation whose only success type is JSON Lines returns a `StreamResult`.                                                    | Parse one item per line in `client.stream`.                                                            |

## Return type

`returnType` is new and defaults to `'plain'`, so existing code keeps working. `'full'` adds `.unwrap()`, and `'data'` resolves to the body when `throwOnError` is `true`. Both `'full'` and `'data'` import extra helpers from your module. See [returnType](https://kubb.dev/extensions/kubb-labs/plugin-client/options#returntype).
