# Stream Server-Sent Events and JSON Lines

Add `client.stream` and its types to your client module, so streamed operations compile and yield typed events or lines.

## Add a stream method

When the spec has a Server-Sent Events or JSON Lines operation, its generated function calls `client.stream` instead of `client`:

::code-group

```typescript [src/gen/clients/chat/streamChat.ts]
import type { Options, StreamResult, SuccessOf, TypedEvent } from '../../../client'
import type { StreamChatOptions, StreamChatResponses } from '../../types/StreamChat'
import { client } from '../../../client'

export function streamChat<ThrowOnError extends boolean = true>(
  options: Options<StreamChatOptions, ThrowOnError> = {},
): Promise<StreamResult<StreamChatResponses, ThrowOnError, TypedEvent<SuccessOf<StreamChatResponses>>>> {
  const { client: apiClient = client, ...config } = options

  return apiClient.stream<StreamChatResponses, ThrowOnError, TypedEvent<SuccessOf<StreamChatResponses>>>({
    method: 'POST',
    url: '/chat',
    contentType: { response: 'text/event-stream' },
    eventShape: 'event',
    rawData: true,
    ...config,
    throwOnError: config.throwOnError ?? true,
  })
}
```

```typescript [src/client.ts]
export type SuccessOf<TResponses> = TResponses[Extract<keyof TResponses, '200' | '201' | '202' | '203' | '204' | '205' | '206' | '207' | '208' | '226' | '2xx'>]

export type ServerSentEvent<TData = unknown> = { data: TData; event: string; id?: string; retry?: number }

export type TypedEvent<TEvent> = TEvent & Pick<ServerSentEvent, 'id' | 'retry'>

export type StreamResult<TResponses, ThrowOnError extends boolean = true, TEvent = ServerSentEvent<SuccessOf<TResponses>>> = {
  stream: AsyncGenerator<TEvent>
  response: Response
}

client.stream = async <TResponses, ThrowOnError extends boolean = true, TEvent = ServerSentEvent<SuccessOf<TResponses>>>(
  config: RequestConfig,
): Promise<StreamResult<TResponses, ThrowOnError, TEvent>> => {
  // send the request, then parse the body into TEvent values
}
```

::

| Call                                                     | Must return                                              |
| -------------------------------------------------------- | -------------------------------------------------------- |
| `client<TResponses, ThrowOnError>(config)`               | `Promise<RequestResult<TResponses, ThrowOnError>>`       |
| `client.stream<TResponses, ThrowOnError, TItem>(config)` | `Promise<StreamResult<TResponses, ThrowOnError, TItem>>` |

## Export the stream types

Your module needs these on top of the [contract](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client#check-the-contract):

| Export                          | Kind         | Needed when                                                           |
| ------------------------------- | ------------ | --------------------------------------------------------------------- |
| `client.stream`, `StreamResult` | method, type | The spec has Server-Sent Events or JSON Lines operations.             |
| `SuccessOf`, `TypedEvent`       | type         | A stream names each event (both) or streams JSON Lines (`SuccessOf`). |

## Type each item

The third type argument, `TItem`, follows the document:

| The document           | `TItem`                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Names each event       | `TypedEvent<SuccessOf<TResponses>>`                                                 |
| Streams JSON Lines     | `SuccessOf<TResponses>`                                                             |
| Types only the payload | Left out. Give `TItem` a default, such as `ServerSentEvent<SuccessOf<TResponses>>`. |

## Read the stream fields

Declare these fields on `RequestConfig`. The call passes them next to the [usual fields](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client#check-the-contract):

| Field         | Passed when                                                      | Value                                                                          |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `contentType` | The operation has a body, streams, or offers `text/event-stream` | `request` is the body's media type, `response` the one to ask for in `Accept`. |
| `eventShape`  | A Server-Sent Events operation                                   | `'event'` or `'data'`: what `validator.response` checks on each event.         |
| `rawData`     | A Server-Sent Events operation types `data` as a string          | `true`, or the names of those events. Keep their `data` as text.               |

## Parse JSON Lines

A JSON Lines call, such as `application/jsonl` or `application/x-ndjson`, passes the media type in `contentType.response` and expects one parsed item per line.

The shared runtime's `sse.ts` exports both parsers: `parseEventStream` reads events and applies `rawData`, and `parseJsonLines` reads one item per line.

## Streams with full or data return types

With [`returnType`](https://kubb.dev/extensions/kubb-labs/plugin-client/options#returntype) `'full'` or `'data'`, every operation imports helpers from your module, and streams import more types:

| `returnType` | Extra exports                                            | Stream operations also import            |
| ------------ | -------------------------------------------------------- | ---------------------------------------- |
| `'full'`     | `withUnwrap`, `resolveThrowOnError`, `Unwrappable`       | `StreamOptions`, `StreamResult`          |
| `'data'`     | `unwrapResult`, `resolveThrowOnError`, `UnwrappedResult` | `StreamOptions`, `UnwrappedStreamResult` |

`'full'` and `'data'` need a `StreamResult` with `data` and `error`, so the minimal type in [Add a stream method](#add-a-stream-method) is not enough. `@kubb/plugin-client/templates/core.ts` exports all of these.

Next, build the client [on the shared runtime](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client#write-the-client), which ships `client.stream`.
