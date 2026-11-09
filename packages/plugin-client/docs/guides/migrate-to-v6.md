# Migrate to v6

`@kubb/plugin-client` 6 passes the full event type and a `contentType` to a custom client's stream helpers. Projects without server-sent event operations need no change.

## Stream exports of your client

Export `ServerSentEvent` next to `TypedEvent`, and make `toEventStream` and `EventStreamResult` take the full event type instead of the payload:

```typescript
export type ServerSentEvent<TData = unknown> = { data: TData; event: string; id?: string; retry?: number }

export type EventStreamResult<TEvent = ServerSentEvent> = { stream: AsyncGenerator<TEvent>; response: Response }

export async function toEventStream<TEvent = ServerSentEvent>(result: Promise<{ data: unknown; response: Response }>): Promise<EventStreamResult<TEvent>> {
  // parse the stream into TEvent values
}
```

A generated function calls `toEventStream<ServerSentEvent<Payload>>` when the document types only the payload, and `toEventStream<TypedEvent<Event>>` when it names each event. See [Write your client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client).

## `contentType` on the request config

A stream call now passes `contentType: { response: 'text/event-stream' }`, so your client can send `Accept: text/event-stream`. Add the field to your `RequestConfig`, or the generated stream functions fail to compile:

```typescript
export type RequestConfig = {
  // ...
  contentType?: string | { request?: string; response?: string }
}
```
