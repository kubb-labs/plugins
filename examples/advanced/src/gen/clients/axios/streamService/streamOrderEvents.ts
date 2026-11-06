import type { Options, SuccessOf } from '../../../.kubb/client'
import type { EventStreamResult, EventStreamOptions, TypedEvent } from '../../../.kubb/sse'
import type { OrderEvent } from '../../../models/ts/OrderEvent'
import { client } from '../../../.kubb/client'
import { toEventStream } from '../../../.kubb/sse'

/**
 * @description Server-Sent Events stream of an order, one event per step. Each event names itself with `event` and carries the order in `data`.
 * @summary Stream order updates
 * {@link /store/order/:orderId/events}
 */
export function streamOrderEvents<ThrowOnError extends boolean = true>(
  options: Options<
    {
      body?: never
      path: {
        orderId: number
      }
      query?: never
      headers?: never
    },
    ThrowOnError
  > &
    EventStreamOptions,
): Promise<
  EventStreamResult<
    TypedEvent<
      SuccessOf<{
        '200': OrderEvent
      }>
    >
  >
> {
  const { client: request = client, ...config } = options

  return toEventStream<
    TypedEvent<
      SuccessOf<{
        '200': OrderEvent
      }>
    >
  >({
    send: (init) =>
      request({ method: 'GET', url: '/store/order/{orderId}/events', responseType: 'stream', ...config, throwOnError: config.throwOnError ?? true, ...init }),
    client: request,
    config,
    method: 'GET',
    shape: 'event',
    events: ['order_placed', 'order_shipped', 'ping'],
    text: ['ping'],
  })
}
