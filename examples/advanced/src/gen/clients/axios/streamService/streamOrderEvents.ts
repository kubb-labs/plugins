import type { SuccessOf, Unwrappable } from '../../../.kubb/client'
import type { StreamResult, StreamOptions, TypedEvent } from '../../../.kubb/sse'
import type { OrderEvent } from '../../../models/ts/OrderEvent'
import { client, withUnwrap } from '../../../.kubb/client'
import { toEventStream } from '../../../.kubb/sse'

/**
 * `GET /store/order/{orderId}/events`
 * @description Server-Sent Events stream of an order, one event per step. Each event names itself with `event` and carries the order in `data`.
 * @summary Stream order updates
 * @param options - The request (`path`) and per-call settings, such as `client` and `throwOnError`.
 * @returns The stream result, whose `data` yields each item as it arrives.
 */
export function streamOrderEvents<ThrowOnError extends boolean = true>(
  options: StreamOptions<
    {
      body?: never
      path: {
        orderId: number
      }
      query?: never
      headers?: never
    },
    ThrowOnError
  >,
): Unwrappable<
  StreamResult<
    {
      '200': OrderEvent
    },
    ThrowOnError,
    TypedEvent<
      SuccessOf<{
        '200': OrderEvent
      }>
    >
  >
> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    toEventStream<
      TypedEvent<
        SuccessOf<{
          '200': OrderEvent
        }>
      >
    >(
      request({
        method: 'GET',
        url: '/store/order/{orderId}/events',
        contentType: { response: 'text/event-stream' },
        responseType: 'stream',
        ...config,
        throwOnError: config.throwOnError ?? true,
      }),
      { client: request, config, shape: 'event' },
    ) as Promise<
      StreamResult<
        {
          '200': OrderEvent
        },
        ThrowOnError,
        TypedEvent<
          SuccessOf<{
            '200': OrderEvent
          }>
        >
      >
    >,
  )
}
