# Server-sent events

Operations returning `text/event-stream` produce a typed stream rather than a `RequestResult`. The client switches to the axios fetch adapter for these calls unless you set `adapter` yourself, because the default XHR adapter buffers the whole body.

## Consume a stream

Read the `EventStreamResult.stream` with `for await`:

```typescript
import { streamEvents } from './gen/clients/streamEvents'

const { stream } = await streamEvents({})

for await (const event of stream) {
  console.info(event.data)
}
```

`data` is typed from the operation's response schema. Each event also carries the optional SSE
fields, so you can branch on the event name or read the id:

```typescript
type ServerSentEvent<TData> = {
  data: TData
  event?: string
  id?: string
  retry?: number
}
```

The runtime parses each event's `data` as JSON when it is valid and keeps it as the raw string
otherwise.

## Stop early

Break out of the loop to stop reading. The underlying reader is canceled when the iterator
finishes, so an early `break` releases the stream:

```typescript
const { stream } = await streamEvents({})

for await (const event of stream) {
  if (event.event === 'done') break
  render(event.data)
}
```

To stop a stream from outside the loop, pass an `AbortSignal` and abort it. Aborting ends the
request and the iteration:

```typescript
const controller = new AbortController()
const { stream } = await streamEvents({ signal: controller.signal })

// elsewhere, for example on component unmount
controller.abort()
```

## Read the response

Read status and headers from the native `response` before iterating:

```typescript
const { stream, response } = await streamEvents({})

console.info(response.status) // 200
console.info(response.headers.get('x-stream-id'))

for await (const event of stream) {
  handle(event.data)
}
```

## Handle errors

Catch non-2xx responses around the call and iteration, and rethrow other errors such as connection failures:

```typescript
import { ResponseError } from './gen/.kubb/client'

try {
  const { stream } = await streamEvents({})
  for await (const event of stream) {
    handle(event.data)
  }
} catch (error) {
  if (!ResponseError.is(error)) throw error
  console.error('stream rejected', error.status)
}
```

> [!NOTE]
> A drop mid-stream ends the `for await` loop. Track the last event's `id` if you need to reconnect
> from where the stream stopped.

## Limit event size

The parser keeps an event in memory until the blank line that ends it. When one event grows past
`maxEventSize` characters, the `for await` loop throws a `RangeError` and the runtime cancels the
stream. The default is 16,777,216 characters (`16 * 1024 * 1024`). Comment lines do not count.

Pass `maxEventSize` per call to raise or lower the limit, or `Infinity` to turn it off:

```typescript
const { stream } = await streamEvents({ maxEventSize: 64 * 1024 * 1024 })

try {
  for await (const event of stream) {
    handle(event.data)
  }
} catch (error) {
  if (!(error instanceof RangeError)) throw error
  console.error('event too large', error.message)
}
```
