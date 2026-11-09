# Migrate to v6

`@kubb/plugin-client` 6 calls your client with type arguments and streams through a `stream` method on it. Update the `client` export of your module, then regenerate.

## A generic client call

A generated function now calls `client<TResponses, ThrowOnError>(config)` and returns the result with no cast. Make `client` generic and type its result:

```typescript
export const client = <TResponses, ThrowOnError extends boolean = true>(config: RequestConfig) =>
  send(config) as Promise<RequestResult<TResponses, ThrowOnError>>
```

The local name in generated code is `apiClient`: `const { client: apiClient = client, ...config } = options`.

## A stream method instead of toEventStream

A Server-Sent Events or JSON Lines operation calls `client.stream<TResponses, ThrowOnError, TItem>(config)` and returns `StreamResult`. Your module no longer exports `toEventStream` or `EventStreamResult`. Add `stream` to `client` and export `StreamResult`, `SuccessOf`, `TypedEvent`, and `ServerSentEvent`:

```typescript
export type StreamResult<TResponses, ThrowOnError extends boolean = true, TEvent = ServerSentEvent<SuccessOf<TResponses>>> = {
  stream: AsyncGenerator<TEvent>
  response: Response
}

export const client = Object.assign(<TResponses, ThrowOnError extends boolean = true>(config: RequestConfig) => send<TResponses, ThrowOnError>(config), {
  stream: async <TResponses, ThrowOnError extends boolean = true, TEvent = ServerSentEvent<SuccessOf<TResponses>>>(
    config: RequestConfig,
  ): Promise<StreamResult<TResponses, ThrowOnError, TEvent>> => {
    // send the request and parse the body into TEvent values
  },
})
```

A Server-Sent Events call passes `eventShape: 'event'` or `'data'`, and keeps its response validator on `config.validator.response`. See [Write your client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client).

## New fields on the request config

Add these to your `RequestConfig`, or the generated functions that pass them fail to compile:

```typescript
export type RequestConfig = {
  // ...
  contentType?: string | { request?: string; response?: string }
  // Replaces `responseType`, which generated calls no longer pass. Set to 'blob' for binary downloads.
  parseAs?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'
  eventShape?: 'event' | 'data'
}
```

A stream call passes `contentType: { response: 'text/event-stream' }`, so your client can send `Accept: text/event-stream`.

## Security requirements with several schemes

A `security` entry is now an array when one OpenAPI requirement needs several schemes together, such as an API key and a session cookie. Send every scheme of such an entry, or skip it.
