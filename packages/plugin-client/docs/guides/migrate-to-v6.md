# Migrate to v6

`@kubb/plugin-client` 6 calls your client with type arguments and streams through `client.stream`. Update the `client` export of your module, then regenerate.

## A generic client call

A generated function now calls `client<TResponses, ThrowOnError>(config)`. Make `client` generic:

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

export const client = Object.assign(<TResponses, ThrowOnError extends boolean = true>(config: RequestConfig) => send<TResponses, ThrowOnError>(config), {
  stream: async <TResponses, ThrowOnError extends boolean = true, TEvent = ServerSentEvent<SuccessOf<TResponses>>>(
    config: RequestConfig,
  ): Promise<StreamResult<TResponses, ThrowOnError, TEvent>> => {
    // send the request and parse the body into TEvent values
  },
})
```

A Server-Sent Events call also passes `eventShape: 'event'` or `'data'`. See [Write your client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client).

## New fields on the request config

Add these fields to your `RequestConfig`, or the generated functions fail to compile:

```typescript
export type RequestConfig = {
  // ...
  contentType?: string | { request?: string; response?: string }
  // Replaces `responseType`. Binary downloads pass 'blob'.
  parseAs?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'
  eventShape?: 'event' | 'data'
}
```

## Security requirements with several schemes

A `security` entry is an array when one requirement needs several schemes together, such as an API key and a session cookie. Send all of them, or skip the entry.
